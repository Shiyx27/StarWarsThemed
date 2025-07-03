/**
 * Audio Manager for Star Wars Photobooth
 * Handles all audio playback, background music, and sound effects
 */

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = new Map();
        this.backgroundMusic = null;
        this.isInitialized = false;
        this.isMuted = false;
        this.volume = 0.5;
        this.backgroundVolume = 0.3;
        
        // Audio file paths
        this.audioFiles = {
            'imperial-march': '/static/audio/imperial-march.mp3',
            'lightsaber-on': '/static/audio/lightsaber-on.mp3',
            'vader-breathing': '/static/audio/vader-breathing.mp3',
            'tie-fighter': '/static/audio/tie-fighter.mp3',
            'force-push': '/static/audio/force-push.mp3',
            'capture-sound': '/static/audio/camera-shutter.mp3'
        };
        
        this.initializeAudio();
        this.bindEvents();
    }
    
    async initializeAudio() {
        try {
            // Initialize Web Audio API
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Load audio files in background
            this.loadAudioFiles();
            
            // Setup background music
            this.setupBackgroundMusic();
            
            this.isInitialized = true;
            console.log('Audio Manager initialized');
            
        } catch (error) {
            console.error('Error initializing audio:', error);
            this.fallbackToHTMLAudio();
        }
    }
    
    async loadAudioFiles() {
        // Load audio files asynchronously without blocking
        Object.entries(this.audioFiles).forEach(async ([key, path]) => {
            try {
                const response = await fetch(path);
                if (!response.ok) {
                    // Create silent audio buffer as fallback
                    const buffer = this.audioContext.createBuffer(1, 1, 22050);
                    this.sounds.set(key, buffer);
                    return;
                }
                
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                this.sounds.set(key, audioBuffer);
                
            } catch (error) {
                console.warn(`Failed to load audio file ${key}:`, error);
                // Create silent buffer as fallback
                if (this.audioContext) {
                    const buffer = this.audioContext.createBuffer(1, 1, 22050);
                    this.sounds.set(key, buffer);
                }
            }
        });
    }
    
    fallbackToHTMLAudio() {
        console.log('Using HTML Audio fallback');
        
        // Create HTML audio elements as fallback
        Object.entries(this.audioFiles).forEach(([key, path]) => {
            const audio = new Audio();
            audio.src = path;
            audio.volume = this.volume;
            audio.preload = 'none'; // Don't preload to improve performance
            
            // Handle loading errors gracefully
            audio.onerror = () => {
                console.warn(`Failed to load audio: ${key}`);
            };
            
            this.sounds.set(key, audio);
        });
        
        this.isInitialized = true;
    }
    
    setupBackgroundMusic() {
        this.backgroundMusic = document.getElementById('background-audio');
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = this.backgroundVolume;
            this.backgroundMusic.loop = true;
            this.backgroundMusic.preload = 'none'; // Don't preload
            
            // Add event listeners
            this.backgroundMusic.addEventListener('canplaythrough', () => {
                console.log('Background music ready');
            });
            
            this.backgroundMusic.addEventListener('error', (e) => {
                console.warn('Background music error:', e);
            });
        }
    }
    
    bindEvents() {
        // Audio toggle button
        const audioToggle = document.getElementById('audio-toggle');
        if (audioToggle) {
            audioToggle.addEventListener('click', () => this.toggleMute());
        }
        
        // Volume slider
        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.setVolume(parseFloat(e.target.value) / 100);
            });
        }
        
        // Audio control buttons
        const audioButtons = document.querySelectorAll('.audio-btn');
        audioButtons.forEach(button => {
            button.addEventListener('click', () => {
                const soundName = button.getAttribute('data-sound');
                this.playSound(soundName);
                
                // Visual feedback
                button.classList.add('active');
                setTimeout(() => button.classList.remove('active'), 300);
            });
        });
        
        // Auto-play on user interaction
        document.addEventListener('click', this.handleFirstUserInteraction.bind(this), { once: true });
    }
    
    handleFirstUserInteraction() {
        // Resume audio context if suspended
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // Start background music if not muted
        if (!this.isMuted) {
            this.startBackgroundMusic();
        }
    }
    
    playSound(soundName, volume = null) {
        if (!this.isInitialized || this.isMuted) return;
        
        try {
            const sound = this.sounds.get(soundName);
            if (!sound) return;
            
            if (this.audioContext && sound instanceof AudioBuffer) {
                // Web Audio API playback
                const source = this.audioContext.createBufferSource();
                const gainNode = this.audioContext.createGain();
                
                source.buffer = sound;
                source.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                gainNode.gain.value = volume || this.volume;
                source.start();
                
            } else if (sound instanceof HTMLAudioElement) {
                // HTML Audio API playback
                sound.volume = volume || this.volume;
                sound.currentTime = 0;
                
                // Load audio if not loaded
                if (sound.readyState === 0) {
                    sound.load();
                }
                
                sound.play().catch(e => console.warn('Audio play failed:', e));
            }
            
        } catch (error) {
            console.warn(`Error playing sound ${soundName}:`, error);
        }
    }
    
    startBackgroundMusic() {
        if (!this.backgroundMusic || this.isMuted) return;
        
        this.backgroundMusic.volume = this.backgroundVolume;
        
        // Load if not loaded
        if (this.backgroundMusic.readyState === 0) {
            this.backgroundMusic.load();
        }
        
        this.backgroundMusic.play().catch(e => {
            console.warn('Background music play failed:', e);
        });
    }
    
    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
        }
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        const audioToggle = document.getElementById('audio-toggle');
        if (audioToggle) {
            const icon = audioToggle.querySelector('.audio-icon');
            if (icon) {
                icon.textContent = this.isMuted ? '🔇' : '🔊';
            }
        }
        
        if (this.isMuted) {
            this.stopBackgroundMusic();
        } else {
            this.startBackgroundMusic();
        }
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        // Update background music volume
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = this.volume * 0.6;
        }
        
        // Update volume slider
        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) {
            volumeSlider.value = this.volume * 100;
        }
    }
    
    // Special effect sounds
    playLightsaberSound() {
        this.playSound('lightsaber-on', 0.8);
    }
    
    playVaderBreathing() {
        this.playSound('vader-breathing', 0.6);
    }
    
    playTieFighter() {
        this.playSound('tie-fighter', 0.7);
    }
    
    playCaptureSound() {
        this.playSound('capture-sound', 0.5);
    }
    
    destroy() {
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
        }
        
        this.sounds.forEach(sound => {
            if (sound instanceof HTMLAudioElement) {
                sound.pause();
            }
        });
        
        this.sounds.clear();
        this.isInitialized = false;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.audioManager = new AudioManager();
});
