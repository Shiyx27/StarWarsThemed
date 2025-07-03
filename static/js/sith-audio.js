class SithAudioSystem {
    constructor() {
        this.audioContext = null;
        this.sounds = new Map();
        this.musicEnabled = true;
        this.sfxEnabled = true;
        this.backgroundMusic = null;
        this.currentTheme = null;
        this.init();
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.loadSithSounds();
            this.startImperialMarch();
            console.log('🎵 Sith Audio System fully operational');
        } catch (error) {
            console.log('Audio not supported:', error);
        }
    }

    loadSithSounds() {
        // Create advanced Sith sound effects
        this.sounds.set('vader_breathing', () => this.playVaderBreathing());
        this.sounds.set('force_lightning', () => this.playForceLightning());
        this.sounds.set('lightsaber_ignite', () => this.playLightsaberIgnite());
        this.sounds.set('unstable_saber', () => this.playUnstableSaber());
        this.sounds.set('dual_saber', () => this.playDualSaber());
        this.sounds.set('dark_power', () => this.playDarkPower());
        this.sounds.set('sith_activation', () => this.playSithActivation());
        this.sounds.set('camera_capture', () => this.playCameraCapture());
        this.sounds.set('ai_creation_complete', () => this.playAICreation());
        this.sounds.set('filter_off', () => this.playFilterOff());
        this.sounds.set('imperial_march', () => this.playImperialMarch());
        this.sounds.set('cantina_band', () => this.playCantinaTheme());
        this.sounds.set('force_theme', () => this.playForceTheme());
        this.sounds.set('button_hover', () => this.playButtonHover());
        this.sounds.set('notification', () => this.playNotification());
        this.sounds.set('easter_egg', () => this.playEasterEgg());
    }

    playVaderBreathing() {
        if (!this.sfxEnabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = 30;
        oscillator.type = 'sawtooth';
        filter.type = 'lowpass';
        filter.frequency.value = 150;
        
        // Create breathing pattern
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.4);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.8);
        gainNode.gain.linearRampToValueAtTime(0.25, now + 1.5);
        gainNode.gain.linearRampToValueAtTime(0, now + 2.0);
        
        oscillator.start(now);
        oscillator.stop(now + 2.5);
    }

    playForceLightning() {
        if (!this.sfxEnabled || !this.audioContext) return;

        // Create crackling lightning effect
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                const filter = this.audioContext.createBiquadFilter();
                
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.audioContext.destination);
                
                osc.frequency.value = 1000 + Math.random() * 2000;
                osc.type = 'square';
                filter.type = 'highpass';
                filter.frequency.value = 800;
                
                const now = this.audioContext.currentTime;
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                
                osc.start(now);
                osc.stop(now + 0.1);
            }, i * 50 + Math.random() * 50);
        }
    }

    playLightsaberIgnite() {
        if (!this.sfxEnabled || !this.audioContext) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);
        
        // Classic lightsaber ignition
        const now = this.audioContext.currentTime;
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(1000, now + 0.8);
        osc.type = 'sawtooth';
        
        filter.type = 'bandpass';
        filter.frequency.value = 500;
        filter.Q.value = 5;
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
        
        osc.start(now);
        osc.stop(now + 1.0);
    }

    playUnstableSaber() {
        if (!this.sfxEnabled || !this.audioContext) return;

        // Kylo Ren's unstable lightsaber
        const baseFreq = 200;
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                
                osc.frequency.value = baseFreq + Math.random() * 100;
                osc.type = 'sawtooth';
                
                const now = this.audioContext.currentTime;
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                
                osc.start(now);
                osc.stop(now + 0.3);
            }, i * 100);
        }
    }

    playDualSaber() {
        if (!this.sfxEnabled || !this.audioContext) return;

        // Darth Maul's double-bladed lightsaber
        this.playLightsaberIgnite();
        setTimeout(() => this.playLightsaberIgnite(), 200);
    }

    playDarkPower() {
        if (!this.sfxEnabled || !this.audioContext) return;

        // Generic Sith power sound
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.frequency.value = 80;
        osc.type = 'triangle';
        
        const now = this.audioContext.currentTime;
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
        
        osc.start(now);
        osc.stop(now + 1.5);
    }

    playSithActivation() {
        if (!this.sfxEnabled || !this.audioContext) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.frequency.setValueAtTime(300, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.3);
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
        
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.4);
    }

    playCameraCapture() {
        if (!this.sfxEnabled || !this.audioContext) return;

        // Enhanced camera shutter with Sith power
        const osc1 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();
        
        osc1.connect(gain1);
        gain1.connect(this.audioContext.destination);
        
        osc1.frequency.value = 2000;
        osc1.type = 'square';
        
        const now = this.audioContext.currentTime;
        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc1.start(now);
        osc1.stop(now + 0.1);

        // Add dark side enhancement
        setTimeout(() => {
            const osc2 = this.audioContext.createOscillator();
            const gain2 = this.audioContext.createGain();
            
            osc2.connect(gain2);
            gain2.connect(this.audioContext.destination);
            
            osc2.frequency.value = 150;
            osc2.type = 'sine';
            
            gain2.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            
            osc2.start(this.audioContext.currentTime);
            osc2.stop(this.audioContext.currentTime + 0.5);
        }, 100);
    }

    playAICreation() {
        if (!this.sfxEnabled || !this.audioContext) return;

        // AI creation complete sound with Sith power
        const frequencies = [440, 554, 659, 880];
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                
                osc.frequency.value = freq;
                osc.type = 'sine';
                
                gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                
                osc.start(this.audioContext.currentTime);
                osc.stop(this.audioContext.currentTime + 0.3);
            }, index * 150);
        });
    }

    playFilterOff() {
        if (!this.sfxEnabled || !this.audioContext) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.frequency.setValueAtTime(600, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.3);
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
        
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.4);
    }

    playImperialMarch() {
        if (!this.musicEnabled || !this.audioContext) return;

        // Play Imperial March melody
        const melody = [
            {freq: 392, duration: 0.5},  // G
            {freq: 392, duration: 0.5},  // G
            {freq: 392, duration: 0.5},  // G
            {freq: 311, duration: 0.375}, // Eb
            {freq: 466, duration: 0.125}, // Bb
            {freq: 392, duration: 0.5},  // G
            {freq: 311, duration: 0.375}, // Eb
            {freq: 466, duration: 0.125}, // Bb
            {freq: 392, duration: 1.0}   // G
        ];

        let currentTime = this.audioContext.currentTime;
        melody.forEach(note => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.frequency.value = note.freq;
            osc.type = 'square';
            
            gain.gain.setValueAtTime(0.1, currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, currentTime + note.duration);
            
            osc.start(currentTime);
            osc.stop(currentTime + note.duration);
            
            currentTime += note.duration;
        });
    }

    playButtonHover() {
        if (!this.sfxEnabled || !this.audioContext) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.frequency.value = 800;
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0.05, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.1);
    }

    playNotification() {
        if (!this.sfxEnabled || !this.audioContext) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.frequency.setValueAtTime(523, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(784, this.audioContext.currentTime + 0.2);
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.3);
    }

    playEasterEgg() {
        if (!this.sfxEnabled || !this.audioContext) return;

        // R2-D2 style beeps for easter eggs
        const beeps = [800, 1000, 600, 1200, 900, 700];
        beeps.forEach((freq, index) => {
            setTimeout(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                
                osc.frequency.value = freq;
                osc.type = 'sine';
                
                gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                
                osc.start(this.audioContext.currentTime);
                osc.stop(this.audioContext.currentTime + 0.1);
            }, index * 120);
        });
    }

    startImperialMarch() {
        // Play Imperial March on startup if enabled
        if (this.musicEnabled) {
            setTimeout(() => this.playImperialMarch(), 1000);
        }
    }

    playSound(soundName, options = {}) {
        if (this.sounds.has(soundName)) {
            this.sounds.get(soundName)(options);
        } else {
            console.log(`Sound not found: ${soundName}`);
        }
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (this.musicEnabled) {
            this.playImperialMarch();
        }
        return this.musicEnabled;
    }

    toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled;
        return this.sfxEnabled;
    }

    setVolume(volume) {
        // Master volume control (0.0 to 1.0)
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }
}

// Initialize Sith Audio System
window.sithAudio = new SithAudioSystem();
