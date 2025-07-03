class SithPhotobooth {
    constructor() {
        this.currentFilter = 'none';
        this.customFilters = new Map();
        this.isForging = false;
        this.secretsUnlocked = 0;
        this.darkLevel = 1;
        
        this.init();
    }

    init() {
        console.log('🌑 Initializing Sith Photobooth Interface...');
        
        this.bindSithEvents();
        this.updateFilterButtons();
        this.startPerformanceMonitoring();
        this.initializeEasterEggs();
        this.showWelcomeMessage();
        
        console.log('✅ Sith Interface fully operational!');
    }

    bindSithEvents() {
        // Filter selection with sound effects
        document.querySelectorAll('.sith-filter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.currentTarget.dataset.filter;
                this.embraceFilter(filter);
            });

            btn.addEventListener('mouseenter', () => {
                window.sithAudio?.playSound('button_hover');
            });
        });

        // Capture dark moment
        const captureBtn = document.getElementById('capture-darkness');
        if (captureBtn) {
            captureBtn.addEventListener('click', () => this.captureDarkMoment());
        }

        // Forge dark filter
        const forgeBtn = document.getElementById('forge-darkness');
        if (forgeBtn) {
            forgeBtn.addEventListener('click', () => this.forgeWithDarkness());
        }

        // Dark incantation input
        const incantationInput = document.getElementById('dark-incantation');
        if (incantationInput) {
            incantationInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.ctrlKey && !this.isForging) {
                    this.forgeWithDarkness();
                }
            });
        }

        // Audio controls
        const musicToggle = document.getElementById('music-toggle');
        const sfxToggle = document.getElementById('sfx-toggle');

        if (musicToggle) {
            musicToggle.addEventListener('click', () => {
                const enabled = window.sithAudio?.toggleMusic();
                musicToggle.style.color = enabled ? '#ff0000' : '#666666';
                this.showNotification(enabled ? '🎵 Imperial March Enabled' : '🔇 Music Silenced', 'success');
            });
        }

        if (sfxToggle) {
            sfxToggle.addEventListener('click', () => {
                const enabled = window.sithAudio?.toggleSFX();
                sfxToggle.style.color = enabled ? '#ff0000' : '#666666';
                this.showNotification(enabled ? '⚡ Sith Sounds Enabled' : '🔇 Sound Effects Disabled', 'success');
            });
        }

        // Easter egg trigger
        const easterEggBtn = document.getElementById('easter-eggs');
        if (easterEggBtn) {
            easterEggBtn.addEventListener('click', () => this.triggerEasterEgg());
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleSithShortcuts(e));
    }

    async embraceFilter(filterName) {
        try {
            this.showFilterTransition();
            
            const response = await fetch(`/embrace_filter/${filterName}`);
            const data = await response.json();
            
            if (data.status === 'success') {
                this.currentFilter = filterName;
                this.updateFilterButtons();
                this.updateSithStatus(data.dark_message);
                
                // Play filter-specific sound
                if (data.sound_effect && window.sithAudio) {
                    window.sithAudio.playSound(data.sound_effect);
                }
                
                this.secretsUnlocked = data.secrets_unlocked || 0;
                this.updateSecretsDisplay();
                
                // Special effects for certain filters
                if (filterName === 'vader') {
                    this.triggerVaderEffect();
                } else if (filterName === 'emperor') {
                    this.triggerEmperorEffect();
                } else if (filterName === 'kylo') {
                    this.triggerKyloEffect();
                }
                
            } else {
                this.showNotification('The dark side has rejected you...', 'error');
            }
        } catch (error) {
            console.error('Error embracing filter:', error);
            this.showNotification('The Force connection has failed', 'error');
        }
    }

    async forgeWithDarkness() {
        const incantationInput = document.getElementById('dark-incantation');
        const prompt = incantationInput.value.trim();
        
        if (!prompt) {
            this.showNotification('You must speak your dark desires...', 'error');
            incantationInput.focus();
            return;
        }

        if (this.isForging) {
            this.showNotification('The dark side is already forging...', 'warning');
            return;
        }

        this.isForging = true;
        this.showForgingStatus(true);

        try {
            const response = await fetch('/summon_dark_filter', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ prompt: prompt })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                this.addDarkCreation(data.filter_name, prompt);
                this.showNotification(data.message, 'success');
                
                // Play AI creation sound
                window.sithAudio?.playSound('ai_creation_complete');
                
                // Show dark blessing
                if (data.dark_blessing) {
                    setTimeout(() => {
                        this.showNotification(data.dark_blessing, 'success');
                    }, 2000);
                }
                
                incantationInput.value = '';
                
                // Auto-embrace the new creation
                setTimeout(() => this.embraceFilter(data.filter_name), 1000);
                
            } else {
                this.showNotification(data.message || 'The dark side has failed you', 'error');
            }
        } catch (error) {
            console.error('Error forging darkness:', error);
            this.showNotification('The dark side connection has failed', 'error');
        } finally {
            this.isForging = false;
            this.showForgingStatus(false);
        }
    }

    async captureDarkMoment() {
        const captureBtn = document.getElementById('capture-darkness');
        if (!captureBtn) return;

        const originalText = captureBtn.innerHTML;
        
        captureBtn.disabled = true;
        captureBtn.innerHTML = '⚡ CHANNELING DARKNESS...';
        captureBtn.classList.add('capturing');

        try {
            const response = await fetch('/capture_dark_moment');
            const data = await response.json();
            
            if (data.status === 'success') {
                this.showNotification(data.message, 'success');
                
                // Play camera capture sound
                window.sithAudio?.playSound('camera_capture');
                
                // Show Sith quote
                if (data.dark_quote) {
                    setTimeout(() => {
                        this.showNotification(`"${data.dark_quote}"`, 'success');
                    }, 1500);
                }
                
                this.triggerCaptureEffect();
                
            } else {
                this.showNotification(data.message || 'Capture failed', 'error');
            }
        } catch (error) {
            console.error('Error capturing dark moment:', error);
            this.showNotification('Capture failed - the dark side is displeased', 'error');
        } finally {
            setTimeout(() => {
                captureBtn.disabled = false;
                captureBtn.innerHTML = originalText;
                captureBtn.classList.remove('capturing');
            }, 1500);
        }
    }

    addDarkCreation(filterName, prompt) {
        const creationsSection = document.getElementById('dark-creations');
        const creationsGrid = document.getElementById('dark-creations-grid');
        
        if (creationsSection) {
            creationsSection.style.display = 'block';
        }
        
        const filterBtn = document.createElement('button');
        filterBtn.className = 'sith-filter custom-creation fade-in';
        filterBtn.dataset.filter = filterName;
        filterBtn.innerHTML = `
            <div class="filter-icon">🤖</div>
            <div class="filter-name">${this.truncateText(prompt, 12)}</div>
            <div class="filter-power">Power: AI</div>
            <div class="creation-delete" title="Destroy Creation">💀</div>
        `;
        
        filterBtn.addEventListener('click', (e) => {
            if (!e.target.classList.contains('creation-delete')) {
                this.embraceFilter(filterName);
            }
        });

        filterBtn.addEventListener('mouseenter', () => {
            window.sithAudio?.playSound('button_hover');
        });
        
        const deleteBtn = filterBtn.querySelector('.creation-delete');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.destroyCreation(filterName, filterBtn);
        });
        
        if (creationsGrid) {
            creationsGrid.appendChild(filterBtn);
        }
        
        this.customFilters.set(filterName, prompt);
    }

    destroyCreation(filterName, buttonElement) {
        if (confirm('Destroy this dark creation? It cannot be undone...')) {
            buttonElement.style.transition = 'all 0.5s ease';
            buttonElement.style.opacity = '0';
            buttonElement.style.transform = 'scale(0.5) rotate(180deg)';
            
            // Play destruction sound
            window.sithAudio?.playSound('filter_off');
            
            setTimeout(() => {
                buttonElement.remove();
                this.customFilters.delete(filterName);
                
                const creationsGrid = document.getElementById('dark-creations-grid');
                if (creationsGrid && creationsGrid.children.length === 0) {
                    const creationsSection = document.getElementById('dark-creations');
                    if (creationsSection) {
                        creationsSection.style.display = 'none';
                    }
                }
                
                if (this.currentFilter === filterName) {
                    this.embraceFilter('none');
                }
            }, 500);
        }
    }

    // Visual Effects
    showFilterTransition() {
        const viewport = document.querySelector('.sith-viewport');
        if (viewport) {
            viewport.style.filter = 'brightness(1.5) contrast(1.2)';
            setTimeout(() => {
                viewport.style.filter = '';
            }, 400);
        }
    }

    triggerVaderEffect() {
        document.body.style.background = 'radial-gradient(circle, #330000, #000000)';
        setTimeout(() => {
            document.body.style.background = '';
        }, 2000);
    }

    triggerEmperorEffect() {
        // Lightning effect
        this.createLightningFlash();
        window.sithAudio?.playSound('force_lightning');
    }

    triggerKyloEffect() {
        // Unstable red flicker
        let flickerCount = 0;
        const flickerInterval = setInterval(() => {
            document.body.style.filter = flickerCount % 2 === 0 ? 'hue-rotate(20deg)' : '';
            flickerCount++;
            if (flickerCount > 8) {
                clearInterval(flickerInterval);
                document.body.style.filter = '';
            }
        }, 100);
    }

    createLightningFlash() {
        const lightning = document.createElement('div');
        lightning.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(45deg, rgba(138,43,226,0.3), rgba(255,255,255,0.8), rgba(138,43,226,0.3));
            z-index: 9999;
            pointer-events: none;
            animation: lightningFlash 0.2s ease-out;
        `;
        
        document.body.appendChild(lightning);
        
        setTimeout(() => {
            lightning.remove();
        }, 200);
    }

    triggerCaptureEffect() {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,0,0,0.3) 100%);
            z-index: 9999;
            pointer-events: none;
            animation: sithFlash 0.6s ease-out;
        `;
        
        document.body.appendChild(flash);
        
        setTimeout(() => {
            flash.remove();
        }, 600);
    }

    triggerEasterEgg() {
        const easterEggs = [
            () => this.showSithCode(),
            () => this.showDeathStar(),
            () => this.showImperialMessage(),
            () => this.showDarkSideQuote()
        ];
        
        const randomEgg = easterEggs[Math.floor(Math.random() * easterEggs.length)];
        randomEgg();
        
        window.sithAudio?.playSound('easter_egg');
        this.secretsUnlocked++;
        this.updateSecretsDisplay();
    }

    showSithCode() {
        const sithLines = [
            "Peace is a lie, there is only passion.",
            "Through passion, I gain strength.",
            "Through strength, I gain power.",
            "Through power, I gain victory.",
            "Through victory, my chains are broken.",
            "The Force shall free me."
        ];
        
        const line = sithLines[Math.floor(Math.random() * sithLines.length)];
        this.showNotification(`SITH CODE: "${line}"`, 'success');
    }

    showDeathStar() {
        this.showNotification("🌑 That's no moon... it's a space station!", 'success');
    }

    showImperialMessage() {
        const messages = [
            "The Emperor has been expecting you...",
            "Your lack of faith is disturbing.",
            "The dark side of the Force is a pathway to many abilities...",
            "Good... let the hate flow through you."
        ];
        
        const message = messages[Math.floor(Math.random() * messages.length)];
        this.showNotification(message, 'success');
    }

    showDarkSideQuote() {
        const quotes = [
            "Fear leads to anger, anger leads to hate, hate leads to suffering.",
            "Once you start down the dark path, forever will it dominate your destiny.",
            "Power! Unlimited power!",
            "Strike me down, and I will become more powerful than you can possibly imagine."
        ];
        
        const quote = quotes[Math.floor(Math.random() * quotes.length)];
        this.showNotification(`"${quote}"`, 'success');
    }

    // UI Updates
    updateFilterButtons() {
        document.querySelectorAll('.sith-filter').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === this.currentFilter) {
                btn.classList.add('active');
            }
        });
    }

    updateSithStatus(message) {
        const statusElement = document.getElementById('sith-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.classList.add('pulse');
            setTimeout(() => statusElement.classList.remove('pulse'), 1000);
        }
    }

    updateSecretsDisplay() {
        const secretsElement = document.getElementById('secrets-count');
        if (secretsElement) {
            secretsElement.textContent = `Secrets: ${this.secretsUnlocked}/10`;
        }
    }

    showForgingStatus(show) {
        const statusElement = document.getElementById('forging-status');
        const forgeBtn = document.getElementById('forge-darkness');
        
        if (show) {
            if (statusElement) {
                statusElement.classList.remove('hidden');
            }
            if (forgeBtn) {
                forgeBtn.disabled = true;
                forgeBtn.innerHTML = '🌑 FORGING...';
                forgeBtn.classList.add('generating');
            }
        } else {
            if (statusElement) {
                statusElement.classList.add('hidden');
            }
            if (forgeBtn) {
                forgeBtn.disabled = false;
                forgeBtn.innerHTML = '🌑 FORGE WITH DARK AI';
                forgeBtn.classList.remove('generating');
            }
        }
    }

    showNotification(message, type = 'success') {
        const existingNotifications = document.querySelectorAll('.dark-notification');
        existingNotifications.forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `dark-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <div class="notification-glow"></div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.remove('hidden');
        }, 100);
        
        window.sithAudio?.playSound('notification');
        
        const duration = message.length > 50 ? 6000 : 4000;
        setTimeout(() => {
            notification.classList.add('hidden');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 400);
        }, duration);
    }

    showWelcomeMessage() {
        setTimeout(() => {
            this.showNotification('Welcome to the Dark Side, young apprentice...', 'success');
        }, 1000);
    }

    handleSithShortcuts(e) {
        if (e.target.matches('input, textarea')) return;

        switch (e.code) {
            case 'Space':
                e.preventDefault();
                this.captureDarkMoment();
                break;
                
            case 'KeyC':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.captureDarkMoment();
                }
                break;
                
            case 'KeyF':
                if (e.ctrlKey) {
                    e.preventDefault();
                    const incantation = document.getElementById('dark-incantation');
                    if (incantation) incantation.focus();
                }
                break;
                
            case 'Escape':
                this.embraceFilter('none');
                break;
                
            case 'KeyE':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.triggerEasterEgg();
                }
                break;
        }
    }

    startPerformanceMonitoring() {
        setInterval(() => {
            this.updatePerformanceMetrics();
        }, 2000);
    }

    async updatePerformanceMetrics() {
        try {
            const response = await fetch('/sith_performance');
            const stats = await response.json();
            
            const metricsElement = document.getElementById('sith-metrics');
            if (metricsElement) {
                metricsElement.innerHTML = `
                    <span>FPS: ${stats.fps || '--'}</span>
                    <span>Dark Power: ${Math.round((stats.dark_power_level || 1) * 100)}%</span>
                    <span>Filter: ${stats.active_filter || 'None'}</span>
                    <span>Secrets: ${stats.secrets_unlocked || 0}</span>
                `;
            }
            
            // Update power bar
            const powerFill = document.getElementById('dark-power-fill');
            if (powerFill && stats.dark_power_level) {
                powerFill.style.width = `${stats.dark_power_level * 100}%`;
            }
            
        } catch (error) {
            console.log('Performance stats unavailable:', error);
        }
    }

    initializeEasterEggs() {
        // Konami code for ultimate Sith power
        let konamiCode = [];
        const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
        
        document.addEventListener('keydown', (e) => {
            konamiCode.push(e.code);
            konamiCode = konamiCode.slice(-10);
            
            if (konamiCode.join(',') === konamiSequence.join(',')) {
                this.unlockUltimatePower();
            }
        });
    }

    unlockUltimatePower() {
        this.showNotification('🌟 UNLIMITED POWER UNLOCKED! 🌟', 'success');
        window.sithAudio?.playSound('force_lightning');
        
        // Ultimate visual effect
        document.body.style.animation = 'unlimitedPower 3s ease-in-out';
        setTimeout(() => {
            document.body.style.animation = '';
        }, 3000);
        
        this.secretsUnlocked += 5;
        this.updateSecretsDisplay();
    }

    truncateText(text, maxLength) {
        return text.length <= maxLength ? text : text.substring(0, maxLength) + '...';
    }
}

// Add CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes lightningFlash {
        0% { opacity: 0; }
        50% { opacity: 1; }
        100% { opacity: 0; }
    }
    
    @keyframes sithFlash {
        0% { opacity: 0; }
        30% { opacity: 1; }
        100% { opacity: 0; }
    }
    
    @keyframes unlimitedPower {
        0%, 100% { filter: hue-rotate(0deg) brightness(1); }
        25% { filter: hue-rotate(90deg) brightness(1.5); }
        50% { filter: hue-rotate(180deg) brightness(2); }
        75% { filter: hue-rotate(270deg) brightness(1.5); }
    }
    
    .fade-in {
        animation: fadeIn 0.5s ease-in-out;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .pulse {
        animation: pulse 1s ease-in-out;
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
    
    .capturing {
        animation: capturing 1s ease-in-out infinite;
    }
    
    @keyframes capturing {
        0%, 100% { box-shadow: 0 0 20px rgba(255, 0, 0, 0.5); }
        50% { box-shadow: 0 0 40px rgba(255, 0, 0, 1); }
    }
    
    .generating {
        animation: generating 2s ease-in-out infinite;
    }
    
    @keyframes generating {
        0%, 100% { 
            box-shadow: 0 0 20px rgba(255, 69, 0, 0.5);
            transform: scale(1);
        }
        50% { 
            box-shadow: 0 0 40px rgba(255, 69, 0, 1);
            transform: scale(1.02);
        }
    }
    
    .creation-delete {
        position: absolute;
        top: 5px;
        right: 5px;
        background: rgba(255, 0, 0, 0.8);
        color: white;
        border-radius: 50%;
        width: 25px;
        height: 25px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 10;
    }
    
    .custom-creation:hover .creation-delete {
        opacity: 1;
    }
    
    .creation-delete:hover {
        background: rgba(200, 0, 0, 1);
        transform: scale(1.1);
    }
`;
document.head.appendChild(styleSheet);

// Initialize the Sith Photobooth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.sithPhotobooth = new SithPhotobooth();
});
