/**
 * Audio.js
 * Handles game sound effects and background music using Web Audio API
 */

const AudioManager = {
    // Web Audio API context
    context: null,
    
    // Sound buffers
    sounds: {
        move: null,
        rotate: null,
        drop: null,
        land: null,
        clear: null,
        gameOver: null,
        music: null
    },
    
    // Volume settings
    volume: {
        music: 0.5,
        sfx: 0.7
    },
    
    // Music source node
    musicSource: null,
    musicGainNode: null,
    
    // Initialize the audio system
    init() {
        try {
            // Create Audio Context
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.context = new AudioContext();
            
            // Create gain node for music volume control
            this.musicGainNode = this.context.createGain();
            this.musicGainNode.gain.value = this.volume.music;
            this.musicGainNode.connect(this.context.destination);
            
            // Load sound assets
            this._loadSounds();
            
            return true;
        } catch (e) {
            console.error("Web Audio API not supported:", e);
            return false;
        }
    },
    
    // Load all sound files
    _loadSounds() {
        // URLs for sound files - would be replaced with real assets
        const soundUrls = {
            move: 'audio/move.mp3',
            rotate: 'audio/rotate.mp3',
            drop: 'audio/drop.mp3',
            land: 'audio/land.mp3',
            clear: 'audio/clear.mp3',
            gameOver: 'audio/game-over.mp3',
            music: 'audio/music.mp3'
        };
        
        // In a real implementation, we would load the actual sounds
        // For this demo, we'll simulate the sounds using oscillators
        this._createSimulatedSounds();
    },
    
    // Simulate sounds using oscillators for demo purposes
    _createSimulatedSounds() {
        // We'll create these sounds on demand
    },
    
    // Play a movement sound
    playMove() {
        this._playOscillator(220, 'square', 0.1);
    },
    
    // Play a rotation sound
    playRotate() {
        this._playOscillator(330, 'sine', 0.15);
    },
    
    // Play a drop sound
    playDrop() {
        this._playOscillator(440, 'sawtooth', 0.2, 0.1);
    },
    
    // Play a landing sound
    playLand() {
        this._playOscillator(110, 'square', 0.3);
    },
    
    // Play a layer clear sound
    playClear() {
        // Play a quick ascending arpeggio
        this._playOscillator(440, 'sine', 0.1, 0, 0);
        setTimeout(() => this._playOscillator(550, 'sine', 0.1, 0, 0), 50);
        setTimeout(() => this._playOscillator(660, 'sine', 0.1, 0, 0), 100);
        setTimeout(() => this._playOscillator(880, 'sine', 0.2, 0, 0), 150);
    },
    
    // Play game over sound
    playGameOver() {
        // Play a descending pattern
        this._playOscillator(880, 'sawtooth', 0.2, 0, 0);
        setTimeout(() => this._playOscillator(440, 'sawtooth', 0.3, 0, 0), 200);
        setTimeout(() => this._playOscillator(220, 'sawtooth', 0.5, 0.3, 0), 400);
    },
    
    // Helper to play an oscillator with the given parameters
    _playOscillator(frequency, type, duration, attack = 0.01, release = 0.01) {
        if (!this.context) return;
        
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        
        // Apply volume setting
        gainNode.gain.value = 0;
        gainNode.gain.setValueAtTime(0, this.context.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume.sfx, this.context.currentTime + attack);
        gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + duration - release);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        oscillator.start();
        oscillator.stop(this.context.currentTime + duration);
    },
    
    // Start background music
    startMusic() {
        if (!this.context) return;
        
        // For the demo, we'll use a simple repeated pattern
        this._startSimulatedMusic();
    },
    
    // Simulated background music using oscillators
    _startSimulatedMusic() {
        if (this.musicSource) {
            this.stopMusic();
        }
        
        // Create notes and timings for a simple looping pattern
        const playNote = (freq, duration, startTime, volume = 0.5) => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            
            osc.frequency.value = freq;
            osc.type = 'sine';
            
            gain.gain.value = volume * this.volume.music;
            
            osc.connect(gain);
            gain.connect(this.musicGainNode);
            
            osc.start(startTime);
            osc.stop(startTime + duration);
        };
        
        // Simple melody
        const startTime = this.context.currentTime;
        const measure = 2; // 2 seconds per measure
        const baseNote = 220;
        
        // Create a looping function for continuous music
        const scheduleNotes = (time) => {
            // Pattern of notes
            const pattern = [0, 4, 7, 4, 0, 4, 7, 12];
            const durations = [0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.75];
            
            let noteTime = time;
            for (let i = 0; i < pattern.length; i++) {
                const freq = baseNote * Math.pow(2, pattern[i] / 12);
                playNote(freq, durations[i], noteTime);
                noteTime += durations[i];
            }
            
            // Schedule next iteration
            setTimeout(() => {
                scheduleNotes(this.context.currentTime);
            }, (measure * 1000) - 50); // A little before the end to avoid gaps
        };
        
        // Start the loop
        scheduleNotes(startTime);
    },
    
    // Stop background music
    stopMusic() {
        if (this.musicSource) {
            this.musicSource.stop();
            this.musicSource = null;
        }
    },
    
    // Set music volume (0-1)
    setMusicVolume(volume) {
        this.volume.music = Math.max(0, Math.min(1, volume));
        if (this.musicGainNode) {
            this.musicGainNode.gain.value = this.volume.music;
        }
    },
    
    // Set sound effects volume (0-1)
    setSfxVolume(volume) {
        this.volume.sfx = Math.max(0, Math.min(1, volume));
    }
}; 