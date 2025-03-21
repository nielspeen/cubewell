/**
 * Audio.js
 * Handles all audio-related functionality for the game
 */

// Audio Manager
const AudioManager = {
    // Properties
    context: null,
    sounds: {},
    music: null,
    musicGainNode: null,
    sfxGainNode: null,
    initialized: false,
    
    // Initialize the audio system
    init: function() {
        try {
            // Create audio context
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create gain nodes for music and sound effects
            this.musicGainNode = this.context.createGain();
            this.sfxGainNode = this.context.createGain();
            
            // Connect gain nodes to destination
            this.musicGainNode.connect(this.context.destination);
            this.sfxGainNode.connect(this.context.destination);
            
            // Set default volumes
            this.setMusicVolume(0.5);
            this.setSfxVolume(0.7);
            
            // Load sounds
            this.loadSounds();
            
            this.initialized = true;
            console.log("Audio system initialized");
        } catch (e) {
            console.warn("Failed to initialize audio:", e);
            this.initialized = false;
        }
    },
    
    // Load all sounds
    loadSounds: function() {
        // Define sound files
        const soundFiles = {
            rotate: 'sounds/rotate.mp3',
            move: 'sounds/move.mp3',
            place: 'sounds/place.mp3',
            line: 'sounds/line.mp3',
            levelUp: 'sounds/level_up.mp3',
            gameOver: 'sounds/game_over.mp3'
        };
        
        // Load each sound
        for (const [name, path] of Object.entries(soundFiles)) {
            this.loadSound(name, path);
        }
        
        // Load music
        this.loadMusic('sounds/music.mp3');
    },
    
    // Load a sound
    loadSound: function(name, path) {
        fetch(path)
            .then(response => response.arrayBuffer())
            .then(buffer => {
                this.context.decodeAudioData(buffer, decodedData => {
                    this.sounds[name] = decodedData;
                    console.log(`Loaded sound: ${name}`);
                });
            })
            .catch(error => {
                console.warn(`Error loading sound ${name}:`, error);
            });
    },
    
    // Load background music
    loadMusic: function(path) {
        fetch(path)
            .then(response => response.arrayBuffer())
            .then(buffer => {
                this.context.decodeAudioData(buffer, decodedData => {
                    this.music = decodedData;
                    console.log('Music loaded');
                    
                    // Play music once loaded
                    this.playMusic();
                });
            })
            .catch(error => {
                console.warn('Error loading music:', error);
            });
    },
    
    // Play a sound
    playSound: function(name) {
        if (!this.initialized) return;
        
        const sound = this.sounds[name];
        if (!sound) {
            console.warn(`Sound "${name}" not found`);
            return;
        }
        
        try {
            // Create source
            const source = this.context.createBufferSource();
            source.buffer = sound;
            
            // Connect to gain node
            source.connect(this.sfxGainNode);
            
            // Play sound
            source.start(0);
        } catch (e) {
            console.warn(`Error playing sound "${name}":`, e);
        }
    },
    
    // Play background music
    playMusic: function() {
        if (!this.initialized || !this.music) return;
        
        try {
            // Create source
            const source = this.context.createBufferSource();
            source.buffer = this.music;
            
            // Make it loop
            source.loop = true;
            
            // Connect to gain node
            source.connect(this.musicGainNode);
            
            // Play music
            source.start(0);
        } catch (e) {
            console.warn('Error playing music:', e);
        }
    },
    
    // Set music volume
    setMusicVolume: function(volume) {
        if (this.musicGainNode) {
            this.musicGainNode.gain.value = volume;
        }
    },
    
    // Set SFX volume
    setSfxVolume: function(volume) {
        if (this.sfxGainNode) {
            this.sfxGainNode.gain.value = volume;
        }
    },
    
    // Toggle music on/off
    toggleMusic: function() {
        if (!this.musicGainNode) return false;
        
        // Toggle between volume 0 and original volume
        const isMuted = this.musicGainNode.gain.value === 0;
        this.musicGainNode.gain.value = isMuted ? 0.5 : 0;
        
        console.log(`Music ${isMuted ? 'enabled' : 'disabled'}`);
        return isMuted;
    },
    
    // Compatibility methods for older code
    
    // Start music (alias for playMusic)
    startMusic: function() {
        console.log("startMusic called (compatibility method)");
        this.playMusic();
    },
    
    // Play movement sound
    playMove: function() {
        console.log("playMove called (compatibility method)");
        this.playSound('move');
    },
    
    // Play rotation sound
    playRotate: function() {
        console.log("playRotate called (compatibility method)");
        this.playSound('rotate');
    },
    
    // Play drop sound
    playDrop: function() {
        console.log("playDrop called (compatibility method)");
        this.playSound('move');
    },
    
    // Play block landing sound
    playLand: function() {
        console.log("playLand called (compatibility method)");
        this.playSound('place');
    },
    
    // Play clear line sound
    playClear: function() {
        console.log("playClear called (compatibility method)");
        this.playSound('line');
    },
    
    // Play game over sound
    playGameOver: function() {
        console.log("playGameOver called (compatibility method)");
        this.playSound('gameOver');
    },
    
    // Stop background music
    stopMusic: function() {
        console.log("stopMusic called (compatibility method)");
        if (this.musicGainNode) {
            // Set volume to 0 to effectively stop music
            this.musicGainNode.gain.value = 0;
        }
    }
};

export default AudioManager; 