/**
 * Sith Photobooth - Unified Core Logic
 * This single file replaces camera.js, faceDetection.js, and maskManager.js
 * for maximum simplicity and reliability.
 */

class SithPhotoboothCore {
    constructor() {
        // DOM Elements
        this.video = document.getElementById('camera-video');
        this.canvas = document.getElementById('output-canvas');
        this.context = this.canvas.getContext('2d');
        this.maskSelector = document.getElementById('mask-selector');

        // State
        this.masks = [];
        this.maskImages = new Map();
        this.activeMask = null;
        this.isRunning = false;

        // Default settings
        this.width = 640;
        this.height = 480;
        this.userScale = 1.0;
        this.userOffsetX = 0;
        this.userOffsetY = 0;
    }

    async initialize() {
        console.log('🚀 Initializing Unified Sith Photobooth Core...');
        try {
            await this.loadMasks();
            await this.startCamera();
            this.renderMaskSelector();
            this.bindEvents();
            this.start();
            console.log('✅ Unified Core Initialized Successfully!');
        } catch (error) {
            console.error('❌ Core Initialization Failed:', error);
        }
    }

    async loadMasks() {
        this.masks = [
            { id: 'none', name: 'No Mask', image: null, icon: '❌' },
            { id: 'vader-mask', name: 'Darth Vader', image: '/static/masks/vader-mask.png', icon: '🎭', scale: 1.3, offsetY: -0.1 },
            { id: 'storm-trooper', name: 'Storm Trooper', image: '/static/masks/storm-trooper-mask.png', icon: '⚡', scale: 1.4, offsetY: -0.05 },
            { id: 'sith-lord', name: 'Sith Lord', image: '/static/masks/sith-lord-mask.png', icon: '⚔️', scale: 1.2, offsetY: 0 }
        ];

        const promises = this.masks
            .filter(m => m.image)
            .map(m => this.loadMaskImage(m));
        
        await Promise.all(promises);
        console.log('🎭 All mask images loaded.');
    }

    loadMaskImage(mask) {
        return new Promise(resolve => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                this.maskImages.set(mask.id, img);
                resolve();
            };
            img.onerror = () => {
                console.warn(`Failed to load image for ${mask.name}`);
                resolve(); // Resolve anyway to not block initialization
            };
            img.src = mask.image;
        });
    }

    async startCamera() {
        const constraints = {
            video: {
                width: { ideal: this.width },
                height: { ideal: this.height },
                facingMode: 'user'
            },
            audio: false
        };
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.video.srcObject = this.stream;
        await this.video.play();

        this.width = this.video.videoWidth;
        this.height = this.video.videoHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        console.log('📹 Camera started and dimensions set.');
    }

    renderMaskSelector() {
        this.maskSelector.innerHTML = '';
        this.masks.forEach(mask => {
            const card = document.createElement('div');
            card.className = 'mask-card';
            card.dataset.maskId = mask.id;
            card.innerHTML = `<div class="mask-icon">${mask.icon}</div><div class="mask-name">${mask.name}</div>`;
            card.addEventListener('click', () => this.selectMask(mask));
            this.maskSelector.appendChild(card);
        });
    }

    bindEvents() {
        // Simple controls for demo purposes
        document.addEventListener('keydown', (e) => {
            if (!this.activeMask) return;
            const step = e.shiftKey ? 10 : 2;
            if (e.key === 'ArrowUp') this.userOffsetY -= step;
            if (e.key === 'ArrowDown') this.userOffsetY += step;
            if (e.key === 'ArrowLeft') this.userOffsetX -= step;
            if (e.key === 'ArrowRight') this.userOffsetX += step;
            if (e.key === '+' || e.key === '=') this.userScale += 0.05;
            if (e.key === '-') this.userScale -= 0.05;
        });
    }

    selectMask(mask) {
        this.activeMask = mask.id === 'none' ? null : mask;
        console.log(`Selected Mask: ${this.activeMask ? this.activeMask.name : 'None'}`);
        document.querySelectorAll('.mask-card').forEach(c => c.classList.remove('active'));
        if (this.activeMask) {
            document.querySelector(`[data-mask-id="${this.activeMask.id}"]`).classList.add('active');
        }
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.renderLoop();
    }

    stop() {
        this.isRunning = false;
    }

    renderLoop = () => {
        if (!this.isRunning) return;
        
        // Draw video feed
        this.context.drawImage(this.video, 0, 0, this.width, this.height);

        // Simple face detection (center of the screen)
        const face = {
            x: this.width * 0.25,
            y: this.height * 0.2,
            width: this.width * 0.5,
            height: this.height * 0.6
        };

        // Draw mask
        if (this.activeMask) {
            this.drawMask(face);
        }

        requestAnimationFrame(this.renderLoop);
    }

    drawMask(face) {
        const maskImage = this.maskImages.get(this.activeMask.id);
        if (!maskImage) return;

        const maskDef = this.activeMask;
        const baseScale = maskDef.scale || 1.0;
        const finalScale = baseScale * this.userScale;

        const maskWidth = face.width * finalScale;
        const maskHeight = (maskImage.height / maskImage.width) * maskWidth;

        const centerX = face.x + face.width / 2;
        const centerY = face.y + face.height / 2;
        
        const maskX = centerX - (maskWidth / 2) + this.userOffsetX;
        const maskY = centerY - (maskHeight / 2) + (face.height * (maskDef.offsetY || 0)) + this.userOffsetY;

        this.context.drawImage(maskImage, maskX, maskY, maskWidth, maskHeight);
    }
}

// Initialize the core logic when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.sithCore = new SithPhotoboothCore();
    window.sithCore.initialize();
});
