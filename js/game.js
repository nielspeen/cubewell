/**
 * Game - Main game logic for Space Cubes
 */
class Game {
    constructor() {
        // Game properties
        this.score = 0;
        this.level = 1;
        this.fallSpeed = CONFIG.INITIAL_FALL_SPEED;
        this.isPaused = true;
        this.isGameOver = false;
        this.layersCleared = 0; // Track layers cleared for sound effects
        this.displacementTracking = { x: 0, y: 0, z: 0 }; // Track displacement during rotations
        this.blocksPlaced = 0; // Track total blocks placed
        
        // Create Three.js scene
        this.setupScene();
        
        // Create game objects
        this.pit = new Pit(
            CONFIG.PIT_WIDTH,
            CONFIG.PIT_DEPTH,
            CONFIG.PIT_HEIGHT
        );
        this.gameContainer.add(this.pit.mesh);
        
        // Create polycube generator
        this.polycubeGenerator = new PolycubeGenerator();
        
        // Current and next blocks
        this.currentBlock = null;
        this.nextBlocks = [];
        
        // Animation properties
        this.lastFrameTime = 0;
        this.accumulatedTime = 0;
        this.rotationAnimation = null;
        this.dropAnimation = null;
        
        // Set up UI and controls after the game instance is created
        this.ui = null;
        this.controls = null;
        
        // Audio elements
        this.setupAudio();
        
        // Create pause message element (hidden initially)
        this.createPauseMessage();
        
        // Create background
        this.background = new DynamicBackground(this.scene);
        
        // Initialize block queue
        this.generateNextBlocks(3); // Generate 3 blocks initially

        // Handle WebGL context loss
        this.renderer.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            this.handleContextLoss();
        }, false);
    }
    
    /**
     * Set up Three.js scene, camera, and renderer
     */
    setupScene() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        
        // Camera positioned to look directly down into the pit from above
        this.camera = new THREE.PerspectiveCamera(
            60, window.innerWidth / window.innerHeight, 0.1, 1000
        );
        
        // Position camera directly above the center of the pit
        const centerX = CONFIG.PIT_WIDTH / 2;
        const centerY = CONFIG.PIT_DEPTH / 2;
        const cameraHeight = CONFIG.PIT_HEIGHT * 1.5; // High enough to see the entire pit
        
        this.camera.position.set(centerX, centerY, cameraHeight);
        this.camera.lookAt(centerX, centerY, 0); // Look straight down to the bottom
        
        // Create a container for the pit and all game elements
        // This will help us center everything in the scene
        this.gameContainer = new THREE.Group();
        this.scene.add(this.gameContainer);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance",
            failIfMajorPerformanceCaveat: true,
            preserveDrawingBuffer: true,
            stencil: true,
            depth: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
        this.renderer.shadowMap.enabled = true; // Enable shadows for better visuals
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
        document.getElementById('game-canvas').appendChild(this.renderer.domElement);
        
        // Improved lighting for better color visibility
        
        // Ambient light for overall visibility
        const ambientLight = new THREE.AmbientLight(0x666666, 1);
        this.scene.add(ambientLight);
        
        // Main directional light from above
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(centerX, centerY, cameraHeight);
        directionalLight.target.position.set(centerX, centerY, 0);
        this.scene.add(directionalLight);
        this.scene.add(directionalLight.target);
        
        // Add some angled lights for better shape definition
        const sideLight1 = new THREE.DirectionalLight(0xffffff, 0.4);
        sideLight1.position.set(centerX + 10, centerY, cameraHeight / 2);
        sideLight1.target.position.set(centerX, centerY, 0);
        this.scene.add(sideLight1);
        this.scene.add(sideLight1.target);
        
        const sideLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        sideLight2.position.set(centerX, centerY + 10, cameraHeight / 2);
        sideLight2.target.position.set(centerX, centerY, 0);
        this.scene.add(sideLight2);
        this.scene.add(sideLight2.target);
        
        // Initial camera adjustment for current window size
        this.adjustCameraForWindowSize();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            // Get current window dimensions
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            // Update renderer size and pixel ratio
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            
            // Update camera aspect ratio
            this.camera.aspect = width / height;
            
            // Adjust camera for new window size
            this.adjustCameraForWindowSize();
            
            // Update camera projection matrix
            this.camera.updateProjectionMatrix();
        });
    }
    
    /**
     * Adjust camera parameters based on window size to keep pit fully visible
     */
    adjustCameraForWindowSize() {
        // Get pit dimensions
        const pitWidth = CONFIG.PIT_WIDTH;
        const pitDepth = CONFIG.PIT_DEPTH;
        const pitHeight = CONFIG.PIT_HEIGHT;
        
        // Get center of pit
        const centerX = pitWidth / 2;
        const centerY = pitDepth / 2;
        
        // Get window dimensions and aspect ratio
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const windowAspect = windowWidth / windowHeight;
                
        // Choose FOV - slightly wider FOV gives better perspective
        this.camera.fov = 50;
        const fovRadians = this.camera.fov * Math.PI / 180;
        const tanHalfFov = Math.tan(fovRadians / 2);
        
        // Calculate the distance needed to fit pit width into available width
        // This formula derives the distance where an object of width W will appear
        // to have width W' on screen at a given FOV
        const distanceForWidth = (pitWidth / 2) / (tanHalfFov * windowAspect);
        
        // Calculate the distance needed to fit pit depth into available height
        const distanceForDepth = (pitDepth / 2) / tanHalfFov;
        
        // Use the larger distance to ensure both dimensions fit
        let cameraZ = Math.max(distanceForWidth, distanceForDepth);
        
        // Add a minimal buffer to ensure the bottom of the pit is visible
        // This is much less than before - just enough to see bottom layer
        cameraZ += pitHeight * 0.95;
        
        // Apply a slight offset for perspective but keep it small
        const offsetX = -pitWidth * 0.05;
        const offsetY = -pitDepth * 0.05;
        
        // Position the camera
        this.camera.position.set(centerX + offsetX, centerY + offsetY, cameraZ);
        
        // Look at bottom center of pit for better view of all layers
        this.camera.lookAt(centerX, centerY, 0);
        
        // Update projection matrix
        this.camera.aspect = windowAspect;
        this.camera.updateProjectionMatrix();
    }
    
    /**
     * Set up audio for the game
     */
    setupAudio() {
        // Create audio context for sound effects
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Sound effects
        this.sounds = {
            move: null,
            rotate: null,
            land: null,
            clear: null,
            gameOver: null
        };
        
        // Volume
        this.musicVolume = 0.3;
        this.sfxVolume = 0.5;
        
        // Load sounds
        this.createSynthSounds();
        
        // No separate music element - we'll use a direct HTML audio element
        this.music = false;
    }
    
    /**
     * Create synthesized sounds for demo purposes
     */
    createSynthSounds() {
        // Simple sound synthesis for demo
        this.sounds.move = () => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = 300;
            gain.gain.value = this.sfxVolume;
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
            osc.stop(this.audioContext.currentTime + 0.2);
        };
        
        this.sounds.rotate = () => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sawtooth';
            osc.frequency.value = 400;
            gain.gain.value = this.sfxVolume;
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.start();
            osc.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
            osc.stop(this.audioContext.currentTime + 0.1);
        };
        
        this.sounds.land = () => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'triangle';
            osc.frequency.value = 200;
            gain.gain.value = this.sfxVolume;
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.start();
            osc.frequency.exponentialRampToValueAtTime(150, this.audioContext.currentTime + 0.3);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
            osc.stop(this.audioContext.currentTime + 0.3);
        };
        
        this.sounds.clear = () => {
            // Create audio components
            const context = this.audioContext;
            const masterGain = context.createGain();
            masterGain.gain.value = this.sfxVolume;
            masterGain.connect(context.destination);
            
            // Create a compressor for more punch
            const compressor = context.createDynamicsCompressor();
            compressor.threshold.value = -24;
            compressor.knee.value = 30;
            compressor.ratio.value = 12;
            compressor.attack.value = 0.003;
            compressor.release.value = 0.25;
            compressor.connect(masterGain);
            
            // Filter for retro sound
            const filter = context.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 2500; // Slightly higher frequency for more clarity
            filter.Q.value = 6; // Slightly higher Q for more resonance
            filter.connect(compressor);
            
            // Create multiple oscillators for richer sound
            const createTone = (type, freqStart, freqEnd, duration, delay = 0, volumeStart = 0.7, volumeEnd = 0.001) => {
                const oscillator = context.createOscillator();
                const gain = context.createGain();
                
                oscillator.type = type;
                oscillator.frequency.value = freqStart;
                gain.gain.value = 0;
                
                oscillator.connect(gain);
                gain.connect(filter);
                
                const startTime = context.currentTime + delay;
                
                // Schedule parameter changes
                oscillator.start(startTime);
                
                // Volume envelope with faster attack
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(volumeStart, startTime + 0.01);
                
                // Frequency sweep
                if (freqEnd !== freqStart) {
                    oscillator.frequency.exponentialRampToValueAtTime(freqEnd, startTime + duration - 0.05);
                }
                
                // Final volume fade
                gain.gain.exponentialRampToValueAtTime(volumeEnd, startTime + duration);
                
                // Stop oscillator
                oscillator.stop(startTime + duration + 0.05);
                
                return { oscillator, gain };
            };
            
            // Create the main ascending arpeggio with higher base frequency
            const baseFreq = 330; // Higher base frequency for more excitement
            const notes = [1, 1.25, 1.5, 2, 2.5, 3, 3.5, 4]; // Added more notes
            notes.forEach((ratio, index) => {
                const delay = index * 0.05; // Faster timing
                createTone('sawtooth', baseFreq * ratio, baseFreq * ratio * 1.02, 0.25, delay, 0.35);
            });
            
            // Add a sweep at the end for emphasis
            createTone('sine', baseFreq * 4, baseFreq * 8, 0.35, 0.3, 0.45);
            
            // Create additional harmonized notes
            createTone('square', baseFreq * 2, baseFreq * 4, 0.4, 0.15, 0.2);
            
            // Add a low frequency bass note with more presence
            createTone('triangle', baseFreq / 2, baseFreq / 2, 0.5, 0, 0.6);
            
            // Add a noise burst for explosion effect
            (() => {
                const bufferSize = 2 * context.sampleRate;
                const noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
                const output = noiseBuffer.getChannelData(0);
                
                for (let i = 0; i < bufferSize; i++) {
                    output[i] = Math.random() * 2 - 1;
                }
                
                const noise = context.createBufferSource();
                noise.buffer = noiseBuffer;
                
                const noiseGain = context.createGain();
                noiseGain.gain.value = 0;
                
                // Bandpass filter for noise with higher frequency
                const noiseFilter = context.createBiquadFilter();
                noiseFilter.type = 'bandpass';
                noiseFilter.frequency.value = 1500;
                noiseFilter.Q.value = 1.5;
                
                noise.connect(noiseFilter);
                noiseFilter.connect(noiseGain);
                noiseGain.connect(filter);
                
                const startTime = context.currentTime + 0.25;
                noise.start(startTime);
                
                // Short noise burst with faster attack
                noiseGain.gain.setValueAtTime(0, startTime);
                noiseGain.gain.linearRampToValueAtTime(0.25, startTime + 0.03);
                noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
                
                noise.stop(startTime + 0.3);
            })();
            
            // Add special case for multi-layer clears
            if (this.layersCleared > 1) {
                // Add an extra "bonus" sound for multi-layer clears
                setTimeout(() => {
                    // Higher pitched celebratory sound
                    const bonusFreq = baseFreq * 2.5;
                    
                    // Create descending arpeggio with more notes
                    [4, 3.5, 3, 2.5, 2, 1.5, 1.25, 1].forEach((ratio, index) => {
                        const delay = index * 0.05;
                        createTone('square', bonusFreq * ratio, bonusFreq * ratio, 0.2, delay + 0.35, 0.3);
                    });
                    
                    // Add final chord with more harmonics
                    [1, 1.25, 1.5, 2, 2.5, 3].forEach(ratio => {
                        createTone('sine', bonusFreq * ratio, bonusFreq * ratio, 0.4, 0.6, 0.25);
                    });
                }, 10);
            }
        };
        
        this.sounds.gameOver = () => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sawtooth';
            osc.frequency.value = 880;
            gain.gain.value = this.sfxVolume;
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.start();
            osc.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 1);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1);
            osc.stop(this.audioContext.currentTime + 1);
        };
    }
    
    /**
     * Initialize UI, controls, and multiplayer
     */
    initialize() {
        this.ui = new UI(this);
        this.controls = new Controls(this);
        
        // Generate the first block
        this.spawnBlock();
        
        // Start animation loop
        this.animate(0);
        
        // Resume audio context on user interaction (for sound effects)
        const enableAudio = () => {
            // Only need to do this once
            document.body.removeEventListener('click', enableAudio);
            document.body.removeEventListener('keydown', enableAudio);
            
            // Resume audio context for sound effects
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        };
        
        // Add event listeners for first interaction
        document.body.addEventListener('click', enableAudio);
        document.body.addEventListener('keydown', enableAudio);
    }
    
    /**
     * Animation loop
     */
    animate(currentTime) {
        // Calculate delta time
        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;
        
        // Always update background, regardless of game state
        if (this.background) {
            this.background.update(deltaTime);
        }
        
        // Handle rotation animation even if paused
        if (this.rotationAnimation) {
            this.updateRotationAnimation(deltaTime);
            this.renderer.render(this.scene, this.camera);
            requestAnimationFrame((time) => this.animate(time));
            return;
        }
        
        // Handle drop animation even if paused
        if (this.dropAnimation) {
            this.updateDropAnimation(deltaTime);
            this.renderer.render(this.scene, this.camera);
            requestAnimationFrame((time) => this.animate(time));
            return;
        }
        
        // Don't update if paused or delta time is too large (tab was inactive)
        if (this.isPaused || deltaTime > 0.2) {
            // Still render the scene when paused (but not during initialization)
            if (this.currentBlock && this.currentBlock.mesh) {
                this.renderer.render(this.scene, this.camera);
            }
            requestAnimationFrame((time) => this.animate(time));
            return;
        }
        
        // Update game state
        this.update(deltaTime);
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
        
        // Request next frame
        requestAnimationFrame((time) => this.animate(time));
    }
    
    /**
     * Update rotation animation
     */
    updateRotationAnimation(deltaTime) {
        const anim = this.rotationAnimation;
        anim.elapsed += deltaTime;
        
        if (anim.elapsed >= anim.duration) {
            // Animation complete
            this.currentBlock.rotation.copy(anim.targetRotation);
            this.currentBlock.position = [...anim.targetPosition];
            this.currentBlock.updateMesh();
            this.rotationAnimation = null;
            
            // Enable controls after animation completes
            this.isPaused = anim.wasPaused;
        } else {
            // Animation in progress
            const progress = anim.elapsed / anim.duration;
            
            // Use correct way to perform slerp in Three.js for rotation
            this.currentBlock.rotation.slerpQuaternions(
                anim.startRotation,
                anim.targetRotation,
                progress
            );
            
            // Interpolate position for wall kick
            const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
            this.currentBlock.position = [
                anim.startPosition[0] + (anim.targetPosition[0] - anim.startPosition[0]) * easedProgress,
                anim.startPosition[1] + (anim.targetPosition[1] - anim.startPosition[1]) * easedProgress,
                anim.startPosition[2] + (anim.targetPosition[2] - anim.startPosition[2]) * easedProgress
            ];
            
            this.currentBlock.updateMesh();
        }
    }
    
    /**
     * Update drop animation
     */
    updateDropAnimation(deltaTime) {
        const anim = this.dropAnimation;
        anim.elapsed += deltaTime;
        
        if (anim.elapsed >= anim.duration) {
            // Animation complete
            this.currentBlock.position = [...anim.targetPosition];
            this.currentBlock.updateMesh();
            this.dropAnimation = null;
            
            // Enable controls after animation completes
            this.isPaused = anim.wasPaused;
            
            // Land the block
            this.landBlock();
        } else {
            // Animation in progress
            const progress = anim.elapsed / anim.duration;
            
            // Apply easing for smoother animation
            const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
            
            // Interpolate between start and target positions
            const newX = anim.startPosition[0];
            const newY = anim.startPosition[1];
            const newZ = anim.startPosition[2] + (anim.targetPosition[2] - anim.startPosition[2]) * easedProgress;
            
            this.currentBlock.position = [newX, newY, newZ];
            this.currentBlock.updateMesh();
            
            // Update position highlighting
            this.pit.highlightPosition(this.currentBlock);
        }
    }
    
    /**
     * Update game state
     */
    update(deltaTime) {
        // If game over, don't update
        if (this.isGameOver) return;
        
        // Update controls
        this.controls.update();
        
        // Update current block position (falling)
        if (this.currentBlock) {
            this.accumulatedTime += deltaTime;
            
            // Move block down based on fall speed
            if (this.accumulatedTime >= 1 / this.fallSpeed) {
                this.accumulatedTime = 0;
                
                // Try to move down
                const originalPosition = [...this.currentBlock.position];
                this.currentBlock.move(0, 0, -1);
                
                // If can't move down, it has landed
                if (!this.pit.canPlacePolycube(this.currentBlock)) {
                    // Move back to original position
                    this.currentBlock.position = originalPosition;
                    this.currentBlock.updateMesh();
                    
                    // Place block in pit
                    this.landBlock();
                }
            }
            
            // Update the position highlight to show where the block is
            this.pit.highlightPosition(this.currentBlock);
        }
    }
    
    /**
     * Generate next blocks and add them to the queue
     */
    generateNextBlocks(count) {
        for (let i = 0; i < count; i++) {
            const block = this.polycubeGenerator.generate();
            this.nextBlocks.push(block);
        }
    }
    
    /**
     * Spawn a new block at the top of the pit
     */
    spawnBlock() {
        // Get the next block from the queue
        this.currentBlock = this.nextBlocks.shift();
        
        // Try different starting positions for the block
        const startPositions = [
            // Center position
            [Math.floor(CONFIG.PIT_WIDTH / 2), Math.floor(CONFIG.PIT_DEPTH / 2), CONFIG.PIT_HEIGHT - 1],
            // Try offset positions
            [Math.floor(CONFIG.PIT_WIDTH / 2) - 1, Math.floor(CONFIG.PIT_DEPTH / 2), CONFIG.PIT_HEIGHT - 1],
            [Math.floor(CONFIG.PIT_WIDTH / 2) + 1, Math.floor(CONFIG.PIT_DEPTH / 2), CONFIG.PIT_HEIGHT - 1],
            [Math.floor(CONFIG.PIT_WIDTH / 2), Math.floor(CONFIG.PIT_DEPTH / 2) - 1, CONFIG.PIT_HEIGHT - 1],
            [Math.floor(CONFIG.PIT_WIDTH / 2), Math.floor(CONFIG.PIT_DEPTH / 2) + 1, CONFIG.PIT_HEIGHT - 1]
        ];

        let canPlace = false;
        for (const position of startPositions) {
            this.currentBlock.position = position;
            if (this.pit.canPlacePolycube(this.currentBlock)) {
                canPlace = true;
                break;
            }
        }

        // If we couldn't place the block in any position, game is over
        if (!canPlace) {
            this.gameOver();
            return;
        }

        // Create and add mesh to scene AFTER positioning
        const blockMesh = this.currentBlock.createMesh();
        
        // Generate a new block to maintain the queue
        const newBlock = this.polycubeGenerator.generate();
        
        // Add the new block to the queue
        this.nextBlocks.push(newBlock);
        
        // Update UI to show next blocks
        if (this.ui) {
            this.ui.updateNextBlockPreview(this.nextBlocks);
        }
        
        // Only add the mesh to the scene after everything else is ready
        this.gameContainer.add(blockMesh);
        
        // Highlight the block's position on the grid walls
        this.pit.highlightPosition(this.currentBlock);
    }
    
    /**
     * Land the current block and handle scoring
     */
    landBlock() {
        // Play sound
        if (this.sounds.land) {
            this.sounds.land();
        }
        
        // Place the block in the pit
        this.pit.placePolycube(this.currentBlock);
        
        // Remove the block's mesh from the game container
        this.gameContainer.remove(this.currentBlock.mesh);
        
        // Clear position highlighting
        this.pit.highlightPosition(null);
        
        // Add score for placing block
        this.addScore(CONFIG.POINTS_PER_BLOCK);
        
        // Increment blocks placed counter
        this.blocksPlaced++;
        if (this.ui) {
            this.ui.updateBlocks(this.blocksPlaced);
        }
        
        // Increment special block counter only when a block is placed
        this.polycubeGenerator.blocksSinceLastSpecial++;
        console.log('Blocks since last special:', this.polycubeGenerator.blocksSinceLastSpecial, 'Next special in:', this.polycubeGenerator.nextSpecialBlockInterval);
        
        // Handle special block effect
        this.handleSpecialBlockEffect();
        
        // Check for completed lines and layers
        const layersCleared = this.pit.checkAndClearLinesAndLayers((clearedCount) => {
            // Calculate score for cleared lines and layers
            const layerScore = CONFIG.POINTS_PER_LAYER * clearedCount * (clearedCount + 1) / 2;
            this.addScore(layerScore);
            
            // Check if the pit is completely empty after clearing
            if (this.pit.isPitEmpty()) {
                // Award a bonus for clearing the entire pit
                this.addScore(CONFIG.POINTS_PER_LAYER * 10);
                
                // Play special effect for pit clear
                this.playPitClearEffect();
            }
        });
        
        // Store the expected number of lines/layers to be cleared
        this.layersCleared = layersCleared;
        
        // Play sound immediately if lines or layers will be cleared
        if (layersCleared > 0 && this.sounds.clear) {
            this.sounds.clear();
        }
        
        // Spawn a new block
        this.spawnBlock();
    }
    
    /**
     * Handle special block effect
     */
    handleSpecialBlockEffect() {
        // Only proceed if this is actually a special block
        if (!this.currentBlock.isSpecial) {
            return;
        }
        
        console.log('Special block effect triggered!');
        
        // Get the positions of all blocks in the special block
        const positions = this.currentBlock.getWorldPositions();
        
        // Check if any part of the block is below the top layer
        const isPartiallyInHole = positions.some(([x, y, z]) => z < CONFIG.PIT_HEIGHT - 1);
        
        if (isPartiallyInHole) {
            console.log('Special block is partially in a hole, clearing bottom layer');
            // Clear the bottom layer (z = 0)
            this.pit.clearLayerWithAnimation(0, () => {
                // Add bonus points for using special block effect
                this.addScore(CONFIG.POINTS_PER_LAYER);
                // Play the clear layer sound effect
                if (this.sounds.clear) {
                    this.sounds.clear();
                }
                // Remove the special block from the pit
                positions.forEach(([x, y, z]) => {
                    this.pit.grid[x][y][z] = null;
                });
                this.pit.updateVisualBlocks();
            });
        } else {
            console.log('Special block is entirely on top layer, applying penalties');
            
            // 1. Score Penalty: Deduct points
            this.addScore(-CONFIG.POINTS_PER_BLOCK * 2);
            
            // 2. Speed Penalty: Temporarily slow down the game
            const originalSpeed = this.fallSpeed;
            this.fallSpeed *= 0.7; // 30% slower
            setTimeout(() => {
                this.fallSpeed = originalSpeed;
            }, 5000); // Return to normal speed after 5 seconds
            
            // 3. Visual Penalty: Flash the screen red briefly
            const flashOverlay = document.createElement('div');
            flashOverlay.style.position = 'fixed';
            flashOverlay.style.top = '0';
            flashOverlay.style.left = '0';
            flashOverlay.style.width = '100%';
            flashOverlay.style.height = '100%';
            flashOverlay.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
            flashOverlay.style.zIndex = '1000';
            flashOverlay.style.pointerEvents = 'none';
            document.body.appendChild(flashOverlay);
            
            // Remove the flash after 500ms
            setTimeout(() => {
                document.body.removeChild(flashOverlay);
            }, 500);
            
            // 4. Sound Penalty: Play a negative sound effect
            const context = this.audioContext;
            const osc = context.createOscillator();
            const gain = context.createGain();
            
            osc.type = 'sawtooth';
            osc.frequency.value = 100;
            gain.gain.value = this.sfxVolume * 0.5;
            
            osc.connect(gain);
            gain.connect(context.destination);
            
            osc.start();
            osc.frequency.exponentialRampToValueAtTime(50, context.currentTime + 0.3);
            gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);
            osc.stop(context.currentTime + 0.3);
        }
    }
    
    /**
     * Play a special effect when the player clears the entire pit
     */
    playPitClearEffect() {
        const pitCenter = new THREE.Vector3(
            this.pit.width / 2,
            this.pit.depth / 2,
            this.pit.height / 2
        );
        const count = 100;

        // Reusable geometry and material
        // Use BoxGeometry as a base, different shapes per instance aren't easy with InstancedMesh
        const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3); 
        const material = new THREE.MeshBasicMaterial({
            // Use vertexColors or instanceColors - instanceColor is simpler here
            // color: 0xffffff, // Base color if not using instance colors
            transparent: true,
            opacity: 0.9,
        });

        const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
        this.gameContainer.add(instancedMesh);

        // Store instance-specific data
        const dummy = new THREE.Object3D(); // Helper object for matrix calculation
        const velocities = [];
        const rotations = [];
        const initialColors = []; // Store initial HSL for pulsing

        const color = new THREE.Color(); // Reusable color object

        for (let i = 0; i < count; i++) {
            // Initial Position (randomly around center)
            dummy.position.set(
                pitCenter.x + (Math.random() - 0.5) * 2,
                pitCenter.y + (Math.random() - 0.5) * 2,
                pitCenter.z + (Math.random() - 0.5) * 2
            );
            dummy.updateMatrix();
            instancedMesh.setMatrixAt(i, dummy.matrix);

            // Initial Color
            const hue = Math.random();
            color.setHSL(hue, 1, 0.5);
            instancedMesh.setColorAt(i, color);
            initialColors.push({ h: hue, s: 1, l: 0.5 }); // Store HSL

            // Random 3D velocity direction
            const speed = 2 + Math.random() * 5;
            const angle = Math.random() * Math.PI * 2;
            const elevation = Math.random() * Math.PI * 2; // Use full sphere for direction
            velocities.push(
                new THREE.Vector3(
                    speed * Math.cos(angle) * Math.cos(elevation),
                    speed * Math.sin(angle) * Math.cos(elevation),
                    speed * Math.sin(elevation)
                )
            );

            // Random rotation speed (axis can be complex, simple Euler rotation for now)
            rotations.push(
                new THREE.Euler(
                    (Math.random() - 0.5) * Math.PI * 0.1, // Slower rotation
                    (Math.random() - 0.5) * Math.PI * 0.1,
                    (Math.random() - 0.5) * Math.PI * 0.1
                )
            );
        }
        instancedMesh.instanceMatrix.needsUpdate = true;
        instancedMesh.instanceColor.needsUpdate = true;

        // Animation variables
        const startTime = performance.now();
        const duration = 2.0; // seconds

        // Store data needed by the animation function
        instancedMesh.userData.velocities = velocities;
        instancedMesh.userData.rotations = rotations;
        instancedMesh.userData.initialColors = initialColors;
        instancedMesh.userData.startTime = startTime;
        instancedMesh.userData.duration = duration;
        
        // Need references for matrix/color updates
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3(1, 1, 1); // Assuming uniform scale
        const currentRotation = new THREE.Euler();
        const tempColor = new THREE.Color(); // Reusable color for updates

        // Explosion animation function using InstancedMesh
        const animateExplosion = () => {
            const elapsed = (performance.now() - instancedMesh.userData.startTime) / 1000;
            const progress = Math.min(elapsed / instancedMesh.userData.duration, 1);

            if (progress < 1 && instancedMesh.parent) { // Check if still attached
                for (let i = 0; i < count; i++) {
                    // Get current matrix
                    instancedMesh.getMatrixAt(i, matrix);
                    position.setFromMatrixPosition(matrix); // Get current position

                    // Get instance data
                    const vel = instancedMesh.userData.velocities[i];
                    const rot = instancedMesh.userData.rotations[i];
                    const initialHSL = instancedMesh.userData.initialColors[i];

                    // Apply velocity
                    const speedFactor = 0.02 * (1 + progress * 0.5);
                    position.addScaledVector(vel, speedFactor);

                    // Apply rotation (simple accumulation)
                    currentRotation.setFromRotationMatrix(matrix); // Get current rotation
                    currentRotation.x += rot.x;
                    currentRotation.y += rot.y;
                    currentRotation.z += rot.z;
                    quaternion.setFromEuler(currentRotation);

                    // Update matrix
                    matrix.compose(position, quaternion, scale);
                    instancedMesh.setMatrixAt(i, matrix);
                    
                    // Update color (pulsing)
                    const hue = (initialHSL.h + elapsed * 0.5) % 1; // Pulse hue over time
                    tempColor.setHSL(hue, initialHSL.s, initialHSL.l + Math.sin(elapsed * 10 + i) * 0.1); // Pulse lightness
                    instancedMesh.setColorAt(i, tempColor);
                }

                // Update shared material properties
                instancedMesh.material.opacity = Math.max(0, 1 - progress * 1.2);
                instancedMesh.material.needsUpdate = true; // Necessary if opacity changes

                // Mark instance attributes for update
                instancedMesh.instanceMatrix.needsUpdate = true;
                instancedMesh.instanceColor.needsUpdate = true;

                requestAnimationFrame(animateExplosion);
            } else {
                // Remove particles when animation completes or mesh is removed
                if (instancedMesh.parent) {
                    this.gameContainer.remove(instancedMesh);
                }
                // Dispose of geometry and material to free memory
                instancedMesh.geometry.dispose();
                instancedMesh.material.dispose();
            }
        };

        // Play special sound for pit clear
        this.playPitClearSound();

        // Start animation
        requestAnimationFrame(animateExplosion);
    }
    
    /**
     * Play special sound for clearing the entire pit
     */
    playPitClearSound() {
        const context = this.audioContext;
        const masterGain = context.createGain();
        masterGain.gain.value = this.sfxVolume * 1.2; // Slightly louder
        masterGain.connect(context.destination);
        
        // Create effects chain
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -24;
        compressor.connect(masterGain);
        
        // Create reverb for spacious sound
        const convolver = context.createConvolver();
        
        // Generate impulse response for reverb
        const rate = context.sampleRate;
        const length = rate * 2; // 2 seconds
        const impulse = context.createBuffer(2, length, rate);
        const impulseL = impulse.getChannelData(0);
        const impulseR = impulse.getChannelData(1);
        
        // Fill impulse with noise that decays exponentially
        for (let i = 0; i < length; i++) {
            const decay = Math.pow(0.5, i / (rate * 0.5));
            impulseL[i] = (Math.random() * 2 - 1) * decay;
            impulseR[i] = (Math.random() * 2 - 1) * decay;
        }
        
        convolver.buffer = impulse;
        convolver.connect(compressor);
        
        // Create and play a fanfare
        const baseFreq = 220;
        
        // Helper function to create a tone with connection to effects
        const createTone = (type, freq, endFreq, startTime, duration, volume = 0.4) => {
            const osc = context.createOscillator();
            const gain = context.createGain();
            
            osc.type = type;
            osc.frequency.value = freq;
            
            gain.gain.value = 0;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(volume, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            
            if (endFreq && endFreq !== freq) {
                osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration - 0.05);
            }
            
            osc.connect(gain);
            gain.connect(convolver);
            
            osc.start(startTime);
            osc.stop(startTime + duration + 0.05);
        };
        
        // Create a triumphant fanfare sequence
        const now = context.currentTime;
        
        // First chord - major triad
        createTone('sawtooth', baseFreq, baseFreq, now, 0.8, 0.3);
        createTone('sawtooth', baseFreq * 1.25, baseFreq * 1.25, now, 0.8, 0.2);
        createTone('sawtooth', baseFreq * 1.5, baseFreq * 1.5, now, 0.8, 0.2);
        
        // Rising arpeggio
        [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6].forEach((ratio, i) => {
            createTone('square', baseFreq * ratio, baseFreq * ratio, now + i * 0.08, 0.2, 0.15);
        });
        
        // Final chord
        createTone('sawtooth', baseFreq * 2, baseFreq * 2, now + 0.8, 1.2, 0.25);
        createTone('sawtooth', baseFreq * 2.5, baseFreq * 2.5, now + 0.8, 1.2, 0.2);
        createTone('sawtooth', baseFreq * 3, baseFreq * 3, now + 0.8, 1.2, 0.2);
        createTone('sawtooth', baseFreq * 4, baseFreq * 4, now + 0.8, 1.2, 0.15);
        
        // Sweep sound for drama
        createTone('sine', baseFreq / 2, baseFreq * 6, now + 0.8, 1.0, 0.15);
        
        // Add percussion
        (() => {
            // Create noise for percussion
            const bufferSize = context.sampleRate;
            const noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
            
            // Initial impact
            const noise1 = context.createBufferSource();
            noise1.buffer = noiseBuffer;
            
            const noise1Gain = context.createGain();
            noise1Gain.gain.value = 0;
            
            const noise1Filter = context.createBiquadFilter();
            noise1Filter.type = 'bandpass';
            noise1Filter.frequency.value = 300;
            
            noise1.connect(noise1Filter);
            noise1Filter.connect(noise1Gain);
            noise1Gain.connect(convolver);
            
            noise1.start(now);
            noise1Gain.gain.setValueAtTime(0, now);
            noise1Gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
            noise1Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            noise1.stop(now + 0.3);
            
            // Secondary impact
            const noise2 = context.createBufferSource();
            noise2.buffer = noiseBuffer;
            
            const noise2Gain = context.createGain();
            noise2Gain.gain.value = 0;
            
            const noise2Filter = context.createBiquadFilter();
            noise2Filter.type = 'bandpass';
            noise2Filter.frequency.value = 200;
            
            noise2.connect(noise2Filter);
            noise2Filter.connect(noise2Gain);
            noise2Gain.connect(convolver);
            
            noise2.start(now + 0.8);
            noise2Gain.gain.setValueAtTime(0, now + 0.8);
            noise2Gain.gain.linearRampToValueAtTime(0.4, now + 0.81);
            noise2Gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
            noise2.stop(now + 1.2);
        })();
    }
    
    /**
     * Add score and update UI
     */
    addScore(points) {
        this.score += points;
        
        // Update UI
        if (this.ui) {
            this.ui.updateScore(this.score);
        }
        
        // Check for level up
        const newLevel = Math.floor(this.score / CONFIG.LEVEL_UP_SCORE) + 1;
        if (newLevel > this.level) {
            this.levelUp(newLevel);
        }
    }
    
    /**
     * Level up
     */
    levelUp(newLevel) {
        this.level = newLevel;
        
        // Update fall speed
        this.fallSpeed = Math.min(
            CONFIG.INITIAL_FALL_SPEED + (this.level - 1) * CONFIG.SPEED_INCREASE,
            CONFIG.MAX_FALL_SPEED
        );
        
        // Update UI
        if (this.ui) {
            this.ui.updateLevel(this.level);
        }
        
        // Update polycube generator to add more complex shapes
        this.polycubeGenerator.updateLevel(this.level);
    }
    
    /**
     * Move the current block
     */
    moveBlock(dx, dy, dz) {
        if (!this.currentBlock || this.isPaused) return;
        
        // Store original position
        const originalPosition = [...this.currentBlock.position];
        
        // Try to move
        this.currentBlock.move(dx, dy, dz);
        
        // Check if valid position
        if (!this.pit.canPlacePolycube(this.currentBlock)) {
            // Move back if invalid
            this.currentBlock.position = originalPosition;
            this.currentBlock.updateMesh();
            return false;
        }
        
        // Update position highlighting
        this.pit.highlightPosition(this.currentBlock);
        
        // Play sound
        if (this.sounds.move) {
            this.sounds.move();
        }
        
        return true;
    }
    
    /**
     * Rotate the current block
     */
    rotateBlock(axis, angle) {
        if (!this.currentBlock || this.isPaused || this.rotationAnimation) return;
        
        // Store original rotation and position
        const originalRotation = this.currentBlock.rotation.clone();
        const originalPosition = [...this.currentBlock.position];
        
        // Create a quaternion for the target rotation
        const q = new THREE.Quaternion();
        q.setFromAxisAngle(new THREE.Vector3(...axis), angle);
        
        // Calculate target rotation
        const targetRotation = originalRotation.clone().multiply(q);
        
        // Try different positions for wall kick
        // Start with no offset, then try single unit offsets in all directions,
        // then try combinations, and finally try two unit offsets
        const kickOffsets = [
            // No offset
            [0, 0, 0],
            
            // Single unit offsets in all directions
            [1, 0, 0],   // Right
            [-1, 0, 0],  // Left
            [0, 1, 0],   // Forward
            [0, -1, 0],  // Backward
            [0, 0, 1],   // Up
            [0, 0, -1],  // Down
            
            // Diagonal single unit offsets (horizontal)
            [1, 1, 0],   // Right + Forward
            [-1, 1, 0],  // Left + Forward
            [1, -1, 0],  // Right + Backward
            [-1, -1, 0], // Left + Backward
            
            // Diagonal single unit offsets (vertical)
            [1, 0, 1],   // Right + Up
            [-1, 0, 1],  // Left + Up
            [0, 1, 1],   // Forward + Up
            [0, -1, 1],  // Backward + Up
            [1, 0, -1],  // Right + Down
            [-1, 0, -1], // Left + Down
            [0, 1, -1],  // Forward + Down
            [0, -1, -1], // Backward + Down
            
            // Two unit offsets (horizontal)
            [2, 0, 0],   // Two right
            [-2, 0, 0],  // Two left
            [0, 2, 0],   // Two forward
            [0, -2, 0],  // Two backward
            
            // Two unit offsets (vertical)
            [0, 0, 2],   // Two up
            [0, 0, -2],  // Two down
            
            // Mixed offsets (horizontal + vertical)
            [1, 0, 1],   // Right + Up
            [-1, 0, 1],  // Left + Up
            [0, 1, 1],   // Forward + Up
            [0, -1, 1],  // Backward + Up
            [1, 0, -1],  // Right + Down
            [-1, 0, -1], // Left + Down
            [0, 1, -1],  // Forward + Down
            [0, -1, -1]  // Backward + Down
        ];
        
        let validPosition = null;
        
        // Try each position
        for (const offset of kickOffsets) {
            // Apply rotation
            this.currentBlock.rotation.copy(targetRotation);
            
            // Try offset position
            this.currentBlock.position = [
                originalPosition[0] + offset[0],
                originalPosition[1] + offset[1],
                originalPosition[2] + offset[2]
            ];
            
            // Check if valid position
            if (this.pit.canPlacePolycube(this.currentBlock)) {
                validPosition = [...this.currentBlock.position];
                break;
            }
        }
        
        // If no valid position found, revert and return false
        if (!validPosition) {
            this.currentBlock.rotation.copy(originalRotation);
            this.currentBlock.position = originalPosition;
            this.currentBlock.updateMesh();
            return false;
        }
        
        // Create rotation animation
        this.rotationAnimation = {
            startRotation: originalRotation.clone(),
            targetRotation: targetRotation.clone(),
            startPosition: originalPosition,
            targetPosition: validPosition,
            duration: 0.075, // Animation duration in seconds (doubled speed)
            elapsed: 0,
            wasPaused: this.isPaused
        };
        
        // Temporarily pause game during rotation
        this.isPaused = true;
        
        // Play sound
        if (this.sounds.rotate) {
            this.sounds.rotate();
        }
        
        return true;
    }
    
    /**
     * Drop the block quickly to the bottom
     */
    dropBlock() {
        if (!this.currentBlock || this.isPaused || this.dropAnimation) return;
        
        // Find the final position where the block will land
        let finalPosition = [...this.currentBlock.position];
        let tempPosition = [...this.currentBlock.position];
        
        // Determine how far down the block can fall
        let dropDistance = 0;
        let canDrop = true;
        let safetyCounter = 0;
        const maxSafetyCount = CONFIG.PIT_HEIGHT * 2; // Should never need more than twice the pit height
        
        while (canDrop && safetyCounter < maxSafetyCount) {
            safetyCounter++;
            tempPosition[2] -= 1; // Try to move down one more unit
            
            // Safety check - don't check positions below the pit
            if (tempPosition[2] < 0) {
                canDrop = false;
                break;
            }
            
            // Store the current position
            const originalPosition = [...this.currentBlock.position];
            
            // Temporarily move the block to check if it can be placed
            this.currentBlock.position = tempPosition;
            
            // Check if it's a valid position
            if (!this.pit.canPlacePolycube(this.currentBlock)) {
                // Can't drop further, revert to last valid position
                this.currentBlock.position = originalPosition;
                canDrop = false;
            } else {
                // Can drop further, update final position
                finalPosition = [...tempPosition];
                dropDistance++;
            }
        }
        
        // If we hit the safety counter, something went wrong
        if (safetyCounter >= maxSafetyCount) {
            console.warn('Drop block safety counter triggered - forcing drop to last valid position');
        }
        
        // If the block is already at the bottom, just land it
        if (dropDistance === 0) {
            this.landBlock();
            return;
        }
        
        // Play sound at the start of the drop
        if (this.sounds.move) {
            this.sounds.move();
        }
        
        // Set up and start the drop animation
        const startPosition = [...this.currentBlock.position];
        
        // Create drop animation object
        this.dropAnimation = {
            startPosition: startPosition,
            targetPosition: finalPosition,
            duration: Math.min(0.5, Math.max(0.15, dropDistance * 0.03)), // Scale duration with drop distance
            elapsed: 0,
            wasPaused: this.isPaused
        };
        
        // Temporarily pause game during animation
        this.isPaused = true;
        
        // Update position highlighting during animation
        this.pit.highlightPosition(this.currentBlock);
    }
    
    /**
     * Game over
     */
    gameOver() {
        this.isGameOver = true;
        this.isPaused = true;
        
        // Clear position highlighting
        this.pit.highlightPosition(null);
        
        // Play game over sound
        if (this.sounds.gameOver) {
            this.sounds.gameOver();
        }
        
        // Update UI
        if (this.ui) {
            this.ui.showGameOver(this.score);
        }

        // Auto-restart after 5 seconds
        setTimeout(() => {
            this.restart();
        }, 5000);
    }
    
    /**
     * Restart the game
     */
    restart() {
        // Reset game state
        this.score = 0;
        this.level = 1;
        this.fallSpeed = CONFIG.INITIAL_FALL_SPEED;
        this.isGameOver = false;
        this.isPaused = false;
        this.blocksPlaced = 0; // Reset blocks placed counter
        
        // Reset pit
        this.pit.reset();
        
        // Clear game container of current block
        if (this.currentBlock && this.currentBlock.mesh) {
            this.gameContainer.remove(this.currentBlock.mesh);
        }
        
        // Reset polycube generator (this will reset special block tracking)
        this.polycubeGenerator = new PolycubeGenerator();
        
        // Reset and generate new blocks
        this.nextBlocks = [];
        this.generateNextBlocks(3);
        this.spawnBlock();
        
        // Update UI
        if (this.ui) {
            this.ui.updateScore(0);
            this.ui.updateLevel(1);
            this.ui.updateBlocks(0);
            this.ui.hideGameOver();
            this.ui.updateNextBlockPreview(this.nextBlocks);
        }

        // Recreate or activate background
        // If cleanup removed it, we need to recreate it.
        // Ensure DynamicBackground handles being created multiple times if necessary,
        // or modify cleanupResources to not remove it if it should persist.
        if (!this.background || !this.scene.children.includes(this.background.sceneObject)) { // Check if background needs creation/re-adding
            // If DynamicBackground adds itself to the scene, just creating it might be enough
            this.background = new DynamicBackground(this.scene);
        } else {
             // If it wasn't removed, just ensure it's active
            this.background.setActive(true);
        }

        // Reset last frame time to prevent any animation jumps
        this.lastFrameTime = performance.now();

        // Resume audio context if it's suspended
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    /**
     * Create the pause message element
     */
    createPauseMessage() {
        // Check if pause message already exists
        if (document.getElementById('pause-message')) {
            return;
        }
        
        // Create pause message element
        this.pauseMessage = document.createElement('div');
        this.pauseMessage.id = 'pause-message';
        this.pauseMessage.className = 'game-message';
        
        // Different message based on device
        const isMobile = CONFIG.IS_MOBILE;
        this.pauseMessage.innerHTML = isMobile 
            ? `<h2>Game Paused</h2>
               <p>Tap the Pause/Resume button to continue</p>`
            : `<h2>Game Paused</h2>
               <p>Press P to resume</p>`;
        
        // Make sure it's hidden by default
        this.pauseMessage.style.display = 'none';
        
        // Add to the game container
        document.getElementById('game-container').appendChild(this.pauseMessage);
        
        // Add shared styling for game messages if not already added
        if (!document.getElementById('game-message-styles')) {
            const style = document.createElement('style');
            style.id = 'game-message-styles';
            style.textContent = `
                .game-message {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(0, 0, 0, 0.8);
                    padding: 20px;
                    border-radius: 10px;
                    border: 2px solid var(--primary-color);
                    color: white;
                    text-align: center;
                    z-index: 100;
                    box-shadow: 0 0 15px var(--primary-color);
                }
                .game-message h2 {
                    margin-top: 0;
                    color: var(--primary-color);
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * Pause the game
     */
    pause() {
        this.isPaused = true;
        this.background.setActive(false); // Deactivate background when game is paused
        
        // Show pause message if the game has started and welcome message is gone
        // and the game is not over
        const welcomeMessage = document.querySelector('.game-message');
        const welcomeIsHidden = !welcomeMessage || welcomeMessage.style.display === 'none';
        
        if (welcomeIsHidden && !this.isGameOver) {
            this.pauseMessage.style.display = 'block';
        }
    }
    
    /**
     * Resume the game
     */
    resume() {
        if (this.isGameOver) return;
        
        this.isPaused = false;
        this.background.setActive(true); // Reactivate background when game resumes
        this.lastFrameTime = performance.now();
        
        // Hide pause message
        this.pauseMessage.style.display = 'none';
        
        // Resume audio context which may be suspended
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    startGame() {
        this.score = 0;
        this.level = 1;
        this.fallSpeed = CONFIG.INITIAL_FALL_SPEED;
        this.isGameOver = false;
        this.isPaused = false;
        this.pit.clear();
        
        // Reset polycube generator (this will reset special block tracking)
        this.polycubeGenerator = new PolycubeGenerator();
        
        // Generate initial blocks
        this.nextBlocks = [];
        this.generateNextBlocks(3);
        this.spawnBlock();
        
        this.updateScore();
        this.updateLevel();
        this.background.setActive(true); // Activate background when game starts
    }
    
    pauseGame() {
        this.paused = true;
        this.background.setActive(false); // Deactivate background when game is paused
        this.pauseMessage.style.display = 'block';
    }
    
    resumeGame() {
        this.paused = false;
        this.background.setActive(true); // Reactivate background when game resumes
        this.pauseMessage.style.display = 'none';
    }

    /**
     * Handle WebGL context loss
     */
    handleContextLoss() {
        // Stop the animation loop
        this.isPaused = true;
        
        // Clean up resources
        this.cleanupResources();
        
        // Recreate the WebGL context
        this.setupScene();
        
        // Restart the game state
        this.restart();
    }

    /**
     * Clean up resources before context loss
     */
    cleanupResources() {
        // Dispose of geometries and materials
        this.scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            }
        });

        // Clear the scene
        while(this.scene.children.length > 0) { 
            this.scene.remove(this.scene.children[0]); 
        }

        // Dispose of the renderer
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
} 