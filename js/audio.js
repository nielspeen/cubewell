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
    musicPlaying: false,
    
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
            land: 'sounds/place.mp3',
            clear: 'sounds/line.mp3',
            levelup: 'sounds/level_up.mp3',
            gameover: 'sounds/game_over.mp3',
            spawn: 'sounds/move.mp3', // Reuse move sound for spawn
            drop: 'sounds/place.mp3'  // Reuse place sound for drop
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
        console.log(`Attempting to load sound: ${name} from ${path}`);
        fetch(path)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                console.log(`Sound ${name}: Fetch successful`);
                return response.arrayBuffer();
            })
            .then(buffer => {
                console.log(`Sound ${name}: Starting audio decoding`);
                return this.context.decodeAudioData(buffer);
            })
            .then(decodedData => {
                this.sounds[name] = decodedData;
                console.log(`Sound ${name}: Successfully loaded and decoded`);
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
    
    // Play a sound effect
    playSFX: function(name) {
        if (!this.initialized || !this.sounds[name]) {
            return;
        }
        
        try {
            // Resume the audio context if it's suspended
            if (this.context.state === 'suspended') {
                this.context.resume();
            }
            
            // Create a buffer source for the sound
            const source = this.context.createBufferSource();
            source.buffer = this.sounds[name];
            
            // Connect to SFX gain node
            source.connect(this.sfxGainNode);
            
            // Play the sound
            source.start(0);
            console.log(`Playing sound: ${name}`);
        } catch (e) {
            console.warn(`Error playing sound ${name}:`, e);
        }
    },
    
    // Play background music
    playMusic: function() {
        if (!this.initialized || !this.music) {
            return;
        }
        
        try {
            // Resume the audio context if it's suspended
            if (this.context.state === 'suspended') {
                this.context.resume();
            }
            
            // Create a buffer source for the music
            const source = this.context.createBufferSource();
            source.buffer = this.music;
            
            // Connect to music gain node
            source.connect(this.musicGainNode);
            
            // Loop the music
            source.loop = true;
            
            // Play the music
            source.start(0);
            this.musicPlaying = true;
            console.log('Playing music');
        } catch (e) {
            console.warn('Error playing music:', e);
        }
    },
    
    // Stop music
    stopMusic: function() {
        if (!this.initialized) {
            return;
        }
        
        // Set gain to 0 to effectively stop all music
        this.musicGainNode.gain.value = 0;
        
        // After a brief pause, restore the volume but keep music stopped
        setTimeout(() => {
            this.musicGainNode.gain.value = 0.5;
            this.musicPlaying = false;
        }, 100);
        
        console.log('Stopping music');
    },
    
    // Resume music if it was playing before
    resumeMusic: function() {
        if (!this.initialized || this.musicPlaying) {
            return;
        }
        
        this.playMusic();
    },
    
    // Toggle music on/off
    toggleMusic: function() {
        if (!this.initialized) {
            return;
        }
        
        if (this.musicPlaying) {
            this.stopMusic();
        } else {
            this.playMusic();
        }
    },
    
    // Set music volume (0-1)
    setMusicVolume: function(volume) {
        if (!this.initialized) {
            return;
        }
        
        this.musicGainNode.gain.value = Math.max(0, Math.min(1, volume));
    },
    
    // Set SFX volume (0-1)
    setSfxVolume: function(volume) {
        if (!this.initialized) {
            return;
        }
        
        this.sfxGainNode.gain.value = Math.max(0, Math.min(1, volume));
    },
    
    // Debug audio system status
    debugStatus: function() {
        console.log('Audio System Status:');
        console.log(`- Initialized: ${this.initialized}`);
        console.log(`- AudioContext: ${this.context ? this.context.state : 'None'}`);
        console.log(`- Music Volume: ${this.musicGainNode ? this.musicGainNode.gain.value : 'N/A'}`);
        console.log(`- SFX Volume: ${this.sfxGainNode ? this.sfxGainNode.gain.value : 'N/A'}`);
        console.log(`- Loaded Sounds: ${Object.keys(this.sounds).join(', ') || 'None'}`);
        console.log(`- Music Loaded: ${this.music ? 'Yes' : 'No'}`);
        
        return {
            initialized: this.initialized,
            contextState: this.context ? this.context.state : 'None',
            musicVolume: this.musicGainNode ? this.musicGainNode.gain.value : 'N/A',
            sfxVolume: this.sfxGainNode ? this.sfxGainNode.gain.value : 'N/A',
            sounds: Object.keys(this.sounds),
            musicLoaded: !!this.music
        };
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
        this.playSFX('move');
    },
    
    // Play rotation sound
    playRotate: function() {
        console.log("playRotate called (compatibility method)");
        this.playSFX('rotate');
    },
    
    // Play drop sound
    playDrop: function() {
        console.log("playDrop called (compatibility method)");
        this.playSFX('drop');
    },
    
    // Play block landing sound
    playLand: function() {
        console.log("playLand called (compatibility method)");
        this.playSFX('land');
    },
    
    // Play clear line sound
    playClear: function() {
        console.log("playClear called (compatibility method)");
        this.playSFX('clear');
    },
    
    // Play game over sound
    playGameOver: function() {
        console.log("playGameOver called (compatibility method)");
        this.playSFX('gameover');
    }
};

export default AudioManager; 