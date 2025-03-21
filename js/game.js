/**
 * Game - Main game logic for CubeWell
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
        
        // Create Three.js scene
        this.setupScene();
        
        // Create game objects
        this.pit = new Pit(
            CONFIG.PIT_WIDTH,
            CONFIG.PIT_DEPTH,
            CONFIG.PIT_HEIGHT
        );
        this.scene.add(this.pit.mesh);
        
        // Create polycube generator
        this.polycubeGenerator = new PolycubeGenerator();
        
        // Current and next blocks
        this.currentBlock = null;
        this.nextBlock = null;
        
        // Animation properties
        this.lastFrameTime = 0;
        this.accumulatedTime = 0;
        this.rotationAnimation = null;
        this.dropAnimation = null;
        
        // Set up UI and controls after the game instance is created
        this.ui = null;
        this.controls = null;
        this.multiplayer = null;
        
        // Audio elements
        this.setupAudio();
        
        // Create pause message element (hidden initially)
        this.createPauseMessage();
    }
    
    /**
     * Set up Three.js scene, camera, and renderer
     */
    setupScene() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111122);
        
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
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
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
        const centerX = CONFIG.PIT_WIDTH / 2;
        const centerY = CONFIG.PIT_DEPTH / 2;
        
        // Get pit dimensions
        const pitWidth = CONFIG.PIT_WIDTH;
        const pitDepth = CONFIG.PIT_DEPTH;
        const pitHeight = CONFIG.PIT_HEIGHT;
        
        // Calculate aspect ratio
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const windowAspect = windowWidth / windowHeight;
        
        // Get the target size that the pit should appear (inversely related to window size)
        const baseHeight = 7; // Base camera height for a medium-sized window
        
        // Calculate an inverse scale factor - smaller for larger windows
        // This makes the pit appear larger when the window is larger
        let scaleFactor;
        
        if (windowAspect < 1) {
            // Portrait mode
            // Use window height as primary factor but account for width too
            const referenceHeight = 800; // Reference height for medium window
            scaleFactor = Math.pow(referenceHeight / windowHeight, 0.4) * Math.pow(windowAspect, 0.1);
            
            // Adjust FOV for portrait - wider FOV for narrow screens
            let portraitFOV = 65;
            if (windowAspect < 0.6) {
                portraitFOV += (0.6 - windowAspect) * 10;
            }
            this.camera.fov = Math.min(80, Math.max(55, portraitFOV));
        } else {
            // Landscape mode
            // Use window width as primary factor but account for height too
            const referenceWidth = 1200; // Reference width for medium window
            scaleFactor = Math.pow(referenceWidth / windowWidth, 0.4) * Math.pow(1/windowAspect, 0.1);
            
            // Standard FOV for landscape
            this.camera.fov = 60;
        }
        
        // Adjust camera height based on scale factor
        // The smaller the scale factor (larger window), the lower the camera height
        const cameraHeight = baseHeight * Math.max(0.9, Math.min(1.8, scaleFactor));
        
        // Update camera position
        this.camera.position.set(centerX, centerY, pitHeight * cameraHeight / 5);
        
        // Look at the center of the pit
        this.camera.lookAt(centerX, centerY, 0);
        
        // Fine-tune for very small or very large screens
        if (Math.min(windowWidth, windowHeight) < 400) {
            // For very small screens, move the camera back slightly
            this.camera.position.z *= 1.2;
        } else if (Math.max(windowWidth, windowHeight) > 1600) {
            // For very large screens, move the camera closer
            this.camera.position.z *= 0.9;
        }
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
            filter.frequency.value = 2000;
            filter.Q.value = 5;
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
                
                // Volume envelope
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(volumeStart, startTime + 0.02);
                
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
            
            // Create the main ascending arpeggio
            const baseFreq = 220;
            const notes = [1, 1.25, 1.5, 2, 2.5, 3];
            notes.forEach((ratio, index) => {
                const delay = index * 0.07;
                createTone('sawtooth', baseFreq * ratio, baseFreq * ratio * 1.01, 0.3, delay, 0.3);
            });
            
            // Add a sweep at the end for emphasis
            createTone('sine', baseFreq * 3, baseFreq * 6, 0.4, 0.35, 0.4);
            
            // Create additional harmonized notes
            createTone('square', baseFreq * 2, baseFreq * 4, 0.5, 0.2, 0.15);
            
            // Add a low frequency bass note
            createTone('triangle', baseFreq / 2, baseFreq / 2, 0.6, 0, 0.5);
            
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
                
                // Bandpass filter for noise
                const noiseFilter = context.createBiquadFilter();
                noiseFilter.type = 'bandpass';
                noiseFilter.frequency.value = 1000;
                noiseFilter.Q.value = 1;
                
                noise.connect(noiseFilter);
                noiseFilter.connect(noiseGain);
                noiseGain.connect(filter);
                
                const startTime = context.currentTime + 0.3;
                noise.start(startTime);
                
                // Short noise burst
                noiseGain.gain.setValueAtTime(0, startTime);
                noiseGain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
                noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
                
                noise.stop(startTime + 0.35);
            })();
            
            // Add special case for multi-layer clears
            if (this.layersCleared > 1) {
                // Add an extra "bonus" sound for multi-layer clears
                setTimeout(() => {
                    // Higher pitched celebratory sound
                    const bonusFreq = baseFreq * 2;
                    
                    // Create descending arpeggio
                    [3, 2.5, 2, 1.5, 1.25, 1].forEach((ratio, index) => {
                        const delay = index * 0.06;
                        createTone('square', bonusFreq * ratio, bonusFreq * ratio, 0.25, delay + 0.4, 0.25);
                    });
                    
                    // Add final chord
                    [1, 1.25, 1.5, 2].forEach(ratio => {
                        createTone('sine', bonusFreq * ratio, bonusFreq * ratio, 0.5, 0.7, 0.2);
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
        this.multiplayer = new Multiplayer(this);
        
        // Generate the first block
        this.nextBlock = this.polycubeGenerator.generate();
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
    animate(time) {
        requestAnimationFrame((t) => this.animate(t));
        
        // Calculate delta time
        const deltaTime = (time - this.lastFrameTime) / 1000; // in seconds
        this.lastFrameTime = time;
        
        // Handle rotation animation even if paused
        if (this.rotationAnimation) {
            this.updateRotationAnimation(deltaTime);
            this.renderer.render(this.scene, this.camera);
            return; // Skip further rendering while rotating
        }
        
        // Handle drop animation even if paused
        if (this.dropAnimation) {
            this.updateDropAnimation(deltaTime);
            this.renderer.render(this.scene, this.camera);
            return; // Skip further rendering while dropping
        }
        
        // Don't update if paused or delta time is too large (tab was inactive)
        if (this.isPaused || deltaTime > 0.2) {
            // Still render the scene when paused (but not during initialization)
            if (this.currentBlock && this.currentBlock.mesh) {
                this.renderer.render(this.scene, this.camera);
            }
            return;
        }
        
        // Update game state
        this.update(deltaTime);
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
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
            this.currentBlock.updateMesh();
            this.rotationAnimation = null;
            
            // Enable controls after animation completes
            this.isPaused = anim.wasPaused;
        } else {
            // Animation in progress
            const progress = anim.elapsed / anim.duration;
            
            // Use correct way to perform slerp in Three.js
            this.currentBlock.rotation.slerpQuaternions(
                anim.startRotation,
                anim.targetRotation,
                progress
            );
            
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
     * Spawn a new block at the top of the pit
     */
    spawnBlock() {
        // Create the new current block from the next block
        this.currentBlock = this.nextBlock;
        
        // Position at top center of pit BEFORE creating the mesh
        this.currentBlock.position = [
            Math.floor(CONFIG.PIT_WIDTH / 2), 
            Math.floor(CONFIG.PIT_DEPTH / 2), 
            CONFIG.PIT_HEIGHT - 1
        ];
        
        // Check if game is over (can't place new block)
        if (!this.pit.canPlacePolycube(this.currentBlock)) {
            this.gameOver();
            return;
        }
        
        // Generate next block in advance so it's ready before we render
        const nextBlockTemp = this.polycubeGenerator.generate();
        
        // Create and add mesh to scene AFTER positioning
        const blockMesh = this.currentBlock.createMesh();
        
        // Update UI to show next block before we render anything
        if (this.ui) {
            this.ui.updateNextBlockPreview(nextBlockTemp);
        }
        
        // Only add the mesh to the scene after everything else is ready
        this.scene.add(blockMesh);
        
        // Set the next block
        this.nextBlock = nextBlockTemp;
        
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
        
        // Remove the block's mesh from the scene
        this.scene.remove(this.currentBlock.mesh);
        
        // Clear position highlighting
        this.pit.highlightPosition(null);
        
        // Add score for placing block
        this.addScore(CONFIG.POINTS_PER_BLOCK);
        
        // Check for completed layers
        const layersCleared = this.pit.checkAndClearLayers((clearedCount) => {
            this.layersCleared = clearedCount;
            
            if (clearedCount > 0) {
                // Play sound
                if (this.sounds.clear) {
                    this.sounds.clear();
                }
                
                // Calculate score for cleared layers
                // Formula: 100 * layers * (layers + 1) / 2
                // This gives: 1 layer = 100, 2 layers = 300, 3 layers = 600, etc.
                const layerScore = CONFIG.POINTS_PER_LAYER * clearedCount * (clearedCount + 1) / 2;
                this.addScore(layerScore);
                
                // Check if the pit is completely empty after clearing
                if (this.pit.isPitEmpty()) {
                    // Award a bonus for clearing the entire pit
                    this.addScore(CONFIG.POINTS_PER_LAYER * 10); // 1000 points bonus
                    
                    // Play special effect for pit clear
                    this.playPitClearEffect();
                }
            }
        });
        
        // Store the expected number of layers to be cleared
        // This is needed for immediate sound effects before the animation completes
        this.layersCleared = layersCleared;
        
        // Spawn a new block
        this.spawnBlock();
    }
    
    /**
     * Play a special effect when the player clears the entire pit
     */
    playPitClearEffect() {
        // Create an effect with explosions and particles
        const pitCenter = [
            this.pit.width / 2,
            this.pit.depth / 2,
            this.pit.height / 2
        ];
        
        // Create explosion particles
        const particles = new THREE.Group();
        this.scene.add(particles);
        
        // Create 100 particles
        for (let i = 0; i < 100; i++) {
            // Random color particles
            const hue = Math.random();
            const color = new THREE.Color().setHSL(hue, 1, 0.5);
            
            // Random particle size
            const particleSize = 0.1 + Math.random() * 0.4;
            
            // Random geometry type for variety
            let geometry;
            const geoType = Math.floor(Math.random() * 4);
            if (geoType === 0) {
                geometry = new THREE.BoxGeometry(particleSize, particleSize, particleSize);
            } else if (geoType === 1) {
                geometry = new THREE.SphereGeometry(particleSize / 2, 4, 4);
            } else if (geoType === 2) {
                geometry = new THREE.TetrahedronGeometry(particleSize / 2);
            } else {
                geometry = new THREE.OctahedronGeometry(particleSize / 2);
            }
            
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.9
            });
            
            const particle = new THREE.Mesh(geometry, material);
            
            // Start all particles from center
            particle.position.set(
                pitCenter[0] + (Math.random() - 0.5) * 2,
                pitCenter[1] + (Math.random() - 0.5) * 2,
                pitCenter[2] + (Math.random() - 0.5) * 2
            );
            
            // Random 3D velocity direction
            const speed = 2 + Math.random() * 5;
            const angle = Math.random() * Math.PI * 2;
            const elevation = Math.random() * Math.PI * 2;
            
            particle.userData.velocity = [
                speed * Math.cos(angle) * Math.cos(elevation),
                speed * Math.sin(angle) * Math.cos(elevation),
                speed * Math.sin(elevation)
            ];
            
            // Random rotation
            particle.userData.rotation = [
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2
            ];
            
            particles.add(particle);
        }
        
        // Animation variables
        const startTime = performance.now();
        const duration = 2.0; // seconds
        
        // Explosion animation function
        const animateExplosion = () => {
            const elapsed = (performance.now() - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            
            if (progress < 1) {
                // Move and animate particles
                for (let i = 0; i < particles.children.length; i++) {
                    const particle = particles.children[i];
                    const velocity = particle.userData.velocity;
                    const rotation = particle.userData.rotation;
                    
                    // Apply velocity - particles move faster as they go further
                    const speedFactor = 0.02 * (1 + progress * 0.5);
                    particle.position.x += velocity[0] * speedFactor;
                    particle.position.y += velocity[1] * speedFactor;
                    particle.position.z += velocity[2] * speedFactor;
                    
                    // Apply rotation
                    particle.rotation.x += rotation[0];
                    particle.rotation.y += rotation[1];
                    particle.rotation.z += rotation[2];
                    
                    // Fade out gradually
                    particle.material.opacity = Math.max(0, 1 - progress * 1.2);
                    
                    // Add color pulsing
                    const hue = (particle.material.color.getHSL({h:0,s:0,l:0}).h + 0.01) % 1;
                    particle.material.color.setHSL(hue, 1, 0.5 + Math.sin(progress * 10) * 0.2);
                }
                
                requestAnimationFrame(animateExplosion);
            } else {
                // Remove particles when animation completes
                this.scene.remove(particles);
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
        
        // Update multiplayer score
        if (this.multiplayer) {
            this.multiplayer.updateScore(this.score);
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
        
        // Store original rotation
        const originalRotation = this.currentBlock.rotation.clone();
        
        // Create a quaternion for the target rotation
        const q = new THREE.Quaternion();
        q.setFromAxisAngle(new THREE.Vector3(...axis), angle);
        
        // Calculate target rotation
        const targetRotation = originalRotation.clone().multiply(q);
        
        // Temporarily apply rotation to check for collisions
        this.currentBlock.rotation.copy(targetRotation);
        
        // Check if valid position
        if (!this.pit.canPlacePolycube(this.currentBlock)) {
            // Revert if invalid
            this.currentBlock.rotation.copy(originalRotation);
            this.currentBlock.updateMesh();
            return false;
        }
        
        // Revert to original rotation for animation
        this.currentBlock.rotation.copy(originalRotation);
        this.currentBlock.updateMesh();
        
        // Create rotation animation
        this.rotationAnimation = {
            startRotation: originalRotation,
            targetRotation: targetRotation,
            duration: 0.15, // Animation duration in seconds
            elapsed: 0,
            wasPaused: this.isPaused
        };
        
        // Temporarily pause game during rotation
        this.isPaused = true;
        
        // Update position highlighting after rotation completes
        setTimeout(() => {
            if (this.currentBlock) {
                this.pit.highlightPosition(this.currentBlock);
            }
        }, 150); // Match with rotation duration
        
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
        
        while (canDrop) {
            tempPosition[2] -= 1; // Try to move down one more unit
            
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
        
        // If the block is already at the bottom, just land it
        if (dropDistance === 0) {
            this.landBlock();
            return;
        }
        
        // Play sound
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
        this.isPaused = true;
        
        // Reset pit
        this.pit.reset();
        
        // Clear scene of current block
        if (this.currentBlock && this.currentBlock.mesh) {
            this.scene.remove(this.currentBlock.mesh);
        }
        
        // Reset polycube generator
        this.polycubeGenerator = new PolycubeGenerator();
        
        // Generate new blocks
        this.nextBlock = this.polycubeGenerator.generate();
        this.spawnBlock();
        
        // Update UI
        if (this.ui) {
            this.ui.updateScore(0);
            this.ui.updateLevel(1);
            this.ui.hideGameOver();
            this.ui.updateNextBlockPreview(this.nextBlock);
        }
        
        // Reset multiplayer data
        if (this.multiplayer) {
            this.multiplayer.updateScore(0);
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
        this.lastFrameTime = performance.now();
        
        // Hide pause message
        this.pauseMessage.style.display = 'none';
        
        // Resume audio context which may be suspended
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
} 