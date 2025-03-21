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
            // We'll set up basic structures but delay creating AudioContext until user interaction
            console.log("Audio system preparing for initialization");
            this.sounds = {};
            this.initialized = false;
            
            // Set up a flag to track if we need to initialize on user interaction
            this.needsInit = true;
            
            // Pre-load sound definitions (but don't load actual audio files yet)
            this.defineAudioFiles();
            
            // Add a one-time listener for user interaction
            document.addEventListener('click', this._initOnUserInteraction.bind(this), { once: true });
            document.addEventListener('keydown', this._initOnUserInteraction.bind(this), { once: true });
            
            console.log("Audio system will initialize on first user interaction");
            return true;
        } catch (e) {
            console.warn("Failed to prepare audio system:", e);
            return false;
        }
    },
    
    // Initialize audio system after user interaction
    _initOnUserInteraction: function() {
        if (!this.needsInit) return;
        this.needsInit = false;
        
        try {
            console.log("User interaction detected, initializing audio now");
            
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
            
            // Now that context is created after user interaction, load sounds
            this.loadSounds();
            
            this.initialized = true;
            console.log("Audio system fully initialized after user interaction");
        } catch (e) {
            console.warn("Failed to initialize audio after user interaction:", e);
            this.initialized = false;
        }
    },
    
    // Define sound files (without loading)
    defineAudioFiles: function() {
        // Define sound files
        this.soundFiles = {
            rotate: 'sounds/rotate.mp3',
            move: 'sounds/move.mp3',
            land: 'sounds/place.mp3',
            clear: 'sounds/line.mp3',
            levelup: 'sounds/level_up.mp3',
            gameover: 'sounds/game_over.mp3',
            spawn: 'sounds/move.mp3', // Reuse move sound for spawn
            drop: 'sounds/place.mp3'  // Reuse place sound for drop
        };
    },
    
    // Load all sounds
    loadSounds: function() {
        if (!this.context) {
            console.warn("Cannot load sounds - AudioContext not initialized");
            return;
        }
        
        // Load each sound
        for (const [name, path] of Object.entries(this.soundFiles)) {
            this.loadSound(name, path);
        }
        
        // Load music
        this.loadMusic('sounds/music.mp3');
    },
    
    // Load a sound
    loadSound: function(name, path) {
        if (!this.context) {
            console.warn(`Cannot load sound ${name} - AudioContext not initialized`);
            return;
        }
        
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
                return this.context.decodeAudioData(buffer).catch(error => {
                    // Specific handling for decoding errors
                    console.warn(`Error decoding audio data for ${name}:`, error);
                    throw error;
                });
            })
            .then(decodedData => {
                this.sounds[name] = decodedData;
                console.log(`Sound ${name}: Successfully loaded and decoded`);
            })
            .catch(error => {
                console.warn(`Error loading sound ${name}:`, error);
                // Create a silent buffer as a fallback
                this._createSilentBuffer(name);
            });
    },
    
    // Create a silent buffer as fallback
    _createSilentBuffer: function(name) {
        try {
            // Create a short, silent audio buffer
            const sampleRate = this.context.sampleRate;
            const buffer = this.context.createBuffer(2, sampleRate * 0.5, sampleRate);
            
            // Store it in our sounds collection
            this.sounds[name] = buffer;
            console.log(`Created silent fallback for ${name}`);
        } catch (e) {
            console.error(`Failed to create fallback for ${name}:`, e);
        }
    },
    
    // Load background music
    loadMusic: function(path) {
        if (!this.context) {
            console.warn("Cannot load music - AudioContext not initialized");
            return;
        }
        
        fetch(path)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.arrayBuffer();
            })
            .then(buffer => {
                return this.context.decodeAudioData(buffer).catch(error => {
                    console.warn("Error decoding music data:", error);
                    throw error;
                });
            })
            .then(decodedData => {
                this.music = decodedData;
                console.log('Music loaded successfully');
                
                // Play music once loaded
                this.playMusic();
            })
            .catch(error => {
                console.warn('Error loading music:', error);
                // Don't create fallback for music - just skip it
            });
    },
    
    // Play a sound effect
    playSFX: function(name) {
        if (!this.initialized || !this.context) {
            // Try to initialize if needed - first interaction might be a keypress
            if (this.needsInit) {
                this._initOnUserInteraction();
            }
            
            // Still not initialized? Skip the sound
            if (!this.initialized || !this.context) {
                return;
            }
        }
        
        if (!this.sounds[name]) {
            console.warn(`Sound '${name}' not found`);
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
        } catch (e) {
            console.warn(`Error playing sound ${name}:`, e);
        }
    },
    
    // Play background music
    playMusic: function() {
        if (!this.initialized || !this.music || !this.context) {
            // If we're trying to play music before initialization, remember to do it later
            this.shouldPlayMusicOnInit = true;
            return;
        }
        
        if (this.musicPlaying) {
            // Already playing
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
            this.musicSource = source; // Store reference so we can stop it
            console.log('Playing music');
        } catch (e) {
            console.warn('Error playing music:', e);
        }
    },
    
    // Stop music
    stopMusic: function() {
        if (!this.initialized || !this.musicPlaying || !this.musicSource) {
            return;
        }
        
        try {
            // Stop the current music source
            this.musicSource.stop();
            this.musicPlaying = false;
            this.musicSource = null;
            console.log('Stopping music');
        } catch (e) {
            console.warn('Error stopping music:', e);
        }
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
            // Try to initialize if first interaction is music toggle
            if (this.needsInit) {
                this._initOnUserInteraction();
            }
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
        if (!this.initialized || !this.musicGainNode) {
            return;
        }
        
        this.musicGainNode.gain.value = Math.max(0, Math.min(1, volume));
    },
    
    // Set SFX volume (0-1)
    setSfxVolume: function(volume) {
        if (!this.initialized || !this.sfxGainNode) {
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
    
    // Legacy compatibility methods
    playMove: function() {
        this.playSFX('move');
    },
    playRotate: function() {
        this.playSFX('rotate');
    },
    playDrop: function() {
        this.playSFX('drop');
    },
    playLand: function() {
        this.playSFX('land');
    },
    playClear: function() {
        this.playSFX('clear');
    },
    playGameOver: function() {
        this.playSFX('gameover');
    }
};

export default AudioManager; 