class SoundManager {
    constructor() {
        this.audioCtx = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            this.audioCtx = new AudioContext();
            this.initialized = true;
        }
    }

    playClashSound() {
        if (!this.initialized || !this.audioCtx) return;
        
        const ctx = this.audioCtx;
        
        // Resume if suspended
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const t = ctx.currentTime;
        
        // Master gain
        const masterGain = ctx.createGain();
        masterGain.connect(ctx.destination);
        masterGain.gain.setValueAtTime(1.0, t);
        masterGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

        // High frequency triangle for metallic 'ping'
        const osc1 = ctx.createOscillator();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(800, t);
        osc1.frequency.exponentialRampToValueAtTime(1200, t + 0.1);
        
        // Square wave for harsh overtone
        const osc2 = ctx.createOscillator();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(1200, t);
        osc2.frequency.exponentialRampToValueAtTime(2000, t + 0.1);

        // Lower triangle for body hit
        const osc3 = ctx.createOscillator();
        osc3.type = 'triangle';
        osc3.frequency.setValueAtTime(300, t);
        osc3.frequency.exponentialRampToValueAtTime(100, t + 0.2);

        osc1.connect(masterGain);
        osc2.connect(masterGain);
        osc3.connect(masterGain);

        osc1.start(t);
        osc2.start(t);
        osc3.start(t);

        osc1.stop(t + 0.3);
        osc2.stop(t + 0.3);
        osc3.stop(t + 0.3);
    }
}

// Global instance
window.soundManager = new SoundManager();
