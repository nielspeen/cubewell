/**
 * Game.js
 * Handles core game logic including block movement, collision detection,
 * scoring, and game progression
 */

import Pit from './pit.js';
import PolycubeLibrary from './polycubes.js';
import AudioManager from './audio.js';

// Make PolycubeLibrary global for debugging
window.PolycubeLibrary = PolycubeLibrary;

class Game {
    constructor(options = {}) {
        // Debug mode
        this.debug = options.debug || false;
        if (this.debug) console.log("Game constructor called with options:", options);
        
        // Store renderer for quick access
        this.renderer = options.renderer || null;
        
        // Game settings
        this.settings = {
            pitWidth: options.pitWidth || 5,
            pitDepth: options.pitDepth || 5,
            pitHeight: options.pitHeight || 12,
            initialFallSpeed: options.initialFallSpeed || 1000, // ms between falls
            fallSpeedFactor: options.fallSpeedFactor || 0.9, // Speed multiplier per level
            linesPerLevel: options.linesPerLevel || 10, // Number of lines to clear for next level
            maxLevel: options.maxLevel || 20, // Maximum level
            pointsPerBlock: 10,
            pointsPerLayer: 100,
            levelUpScore: 500 // Score increment required for level up
        };
        
        // Game state
        this.state = {
            score: 0,
            level: 1,
            linesCleared: 0,
            isRunning: false,
            isPaused: false,
            isGameOver: false,
            fallSpeed: this.settings.initialFallSpeed, // Time between falls in ms
            highScore: this._loadHighScore()
        };
        
        // Block management
        this.currentBlock = null;
        this.nextBlock = null;
        this.blockBag = [];
        
        // Timer for automatic falling
        this.fallTimer = null;
        
        // Create the pit
        this.pit = new Pit(
            this.settings.pitWidth,
            this.settings.pitDepth,
            this.settings.pitHeight,
            { debug: this.debug }
        );
        
        // Event callbacks
        this.callbacks = {
            onScoreChanged: null,
            onLevelChanged: null,
            onGameOver: null,
            onLayerCleared: null,
            onNextBlockChanged: null,
            onInitialized: null,
            onPaused: null,
            onUnpaused: null
        };
        
        // Track when we're deliberately rotating the block
        this.isDeliberateRotation = false;
        
        // Add a cooldown to prevent rapid consecutive actions
        this.dropCooldown = false;
        
        // Bind event handlers
        this._bindEvents();
        
        // Initialize after creation
        if (this.debug) console.log("Game constructor complete, calling init");
        this.init();
    }
    
    // Reset the game completely
    reset() {
        console.log("Game.reset() - Completely resetting game state");
        
        // Clear any ongoing timers
        clearTimeout(this.fallTimer);
        
        // Reset core variables
        this.currentBlock = null;
        this.nextBlock = null;
        this.blockBag = [];
        
        // Call init to reset the game state and prepare everything
        this.init();
    }
    
    // Initialize or reset the game
    init() {
        if (this.debug) console.log("Game.init() - Initializing game");
        
        // Reset game state
        this.state.score = 0;
        this.state.level = 1;
        this.state.linesCleared = 0;
        this.state.isRunning = false;
        this.state.isGameOver = false;
        this.state.isPaused = false;
        this.state.fallSpeed = this.settings.initialFallSpeed;
        
        // Reset the pit
        this.pit.reset();
        
        // Initialize the polycube library
        try {
            console.log("Initializing PolycubeLibrary:", PolycubeLibrary);
            
            // Check if PolycubeLibrary is correctly imported
            if (!PolycubeLibrary || !PolycubeLibrary.init) {
                console.error("PolycubeLibrary not properly imported, trying to create fallback");
                
                // Create a fallback implementation
                window.PolycubeLibrary = this._createPolycubeFallback();
            }
            
            PolycubeLibrary.init();
            console.log("PolycubeLibrary initialized with", PolycubeLibrary.polycubes.length, "polycubes");
        } catch (e) {
            console.error("Error initializing PolycubeLibrary:", e);
            
            // Create a fallback implementation
            window.PolycubeLibrary = this._createPolycubeFallback();
            window.PolycubeLibrary.init();
        }
        
        // Create a bag of blocks
        this._refillBlockBag();
        
        // Set up initial blocks
        this.nextBlock = this._getNextBlockFromBag();
        
        if (this.debug) console.log("Initial next block:", this.nextBlock);
        
        // Trigger callback if defined
        if (this.callbacks.onInitialized) {
            this.callbacks.onInitialized(this);
        }
    }
    
    // Start the game
    start() {
        if (this.state.isRunning) {
            console.log("Game already running, ignoring start() call");
            return;
        }
        
        if (this.debug) console.log("Game.start() - Starting game");
        
        this.state.isRunning = true;
        this.state.isPaused = false;
        
        // Spawn the first block
        if (!this.currentBlock) {
            this._spawnBlock();
        }
        
        // Start the fall timer
        this._startFallTimer();
    }
    
    // Pause the game
    pause() {
        if (!this.state.isRunning || this.state.isPaused) return;
        
        if (this.debug) console.log("Game.pause() - Pausing game");
        
        this.state.isPaused = true;
        
        // Clear the fall timer
        clearTimeout(this.fallTimer);
        this.fallTimer = null;
        
        // Trigger callback if defined
        if (this.callbacks.onPaused) {
            this.callbacks.onPaused(this);
        }
    }
    
    // Unpause the game
    unpause() {
        if (!this.state.isRunning || !this.state.isPaused) return;
        
        if (this.debug) console.log("Game.unpause() - Unpausing game");
        
        this.state.isPaused = false;
        
        // Restart the fall timer
        this._startFallTimer();
        
        // Trigger callback if defined
        if (this.callbacks.onUnpaused) {
            this.callbacks.onUnpaused(this);
        }
    }
    
    // Getters for game state
    isRunning() { return this.state.isRunning; }
    isPaused() { return this.state.isPaused; }
    isGameOver() { return this.state.isGameOver; }
    
    // Backward compatibility aliases
    resume() { return this.unpause(); }
    getScore() { return this.state.score; }
    getLevel() { return this.state.level; }

    // Set the renderer reference
    setRenderer(renderer) {
        this.renderer = renderer;
    }

    // Bind necessary event handlers
    _bindEvents() {
        // No direct DOM event binding in the game logic
        // This is for internal event setup only
    }

    /**
     * Start the fall timer to automatically move blocks down
     * @private
     */
    _startFallTimer() {
        // Clear any existing timer
        if (this.fallTimer) {
            clearTimeout(this.fallTimer);
        }
        
        // Set new timer
        this.fallTimer = setTimeout(() => {
            if (this.state.isRunning && !this.state.isPaused) {
                this._applyGravity();
                this._startFallTimer(); // Continue the cycle
            }
        }, this.state.fallSpeed);
    }

    /**
     * Apply gravity to make the current block fall
     * @private
     */
    _applyGravity() {
        if (!this.currentBlock) return;
        
        // Save original state
        const originalPosition = this.currentBlock.position.clone();
        const originalQuaternion = this.currentBlock.quaternion.clone();
        
        // Apply gravity
        this.currentBlock.position.y -= 1;
        
        // Update matrix world for accurate collision detection
        this.currentBlock.updateMatrixWorld(true);
        
        if (this._checkCollision(this.currentBlock)) {
            // Revert position but keep rotation
            this.currentBlock.position.copy(originalPosition);
            this.currentBlock.quaternion.copy(originalQuaternion);
            this._landBlock();
        } else {
            // Maintain rotation consistency
            this.currentBlock.quaternion.copy(originalQuaternion);
            this.currentBlock.updateMatrixWorld(true);
        }
    }

    /**
     * Move the current block in the specified direction
     * @param {number} x - X direction (-1 = left, 1 = right)
     * @param {number} y - Y direction (-1 = down, 1 = up)
     * @param {number} z - Z direction (-1 = forward, 1 = backward)
     * @returns {boolean} True if move was successful
     */
    moveCurrentBlock(x, y, z) {
        if (!this.currentBlock || this.state.isPaused || !this.state.isRunning) return false;
        
        // Save original position
        const originalPosition = this.currentBlock.position.clone();
        
        // Apply movement
        this.currentBlock.position.x += x;
        this.currentBlock.position.y += y;
        this.currentBlock.position.z += z;
        
        // Update matrix world for accurate collision detection
        this.currentBlock.updateMatrixWorld(true);
        
        // Check for collisions
        if (this._checkCollision(this.currentBlock)) {
            // Revert position
            this.currentBlock.position.copy(originalPosition);
            this.currentBlock.updateMatrixWorld(true);
            return false;
        }
        
        // Play movement sound
        AudioManager.playSFX('move');
        return true;
    }

    /**
     * Rotate the current block around the specified axis
     * @param {string} axis - The axis to rotate around ('x', 'y', or 'z')
     * @param {number} angle - The angle to rotate by (in radians)
     * @returns {boolean} True if rotation was successful
     */
    rotateCurrentBlock(axis, angle) {
        if (!this.currentBlock || this.state.isPaused || !this.state.isRunning) return false;
        
        // Save original quaternion
        const originalQuaternion = this.currentBlock.quaternion.clone();
        
        // Set flag to indicate this is a deliberate rotation (for renderer animation)
        this.isDeliberateRotation = true;
        
        // Create rotation quaternion based on axis
        let rotationAxis;
        switch (axis.toLowerCase()) {
            case 'x':
                rotationAxis = new THREE.Vector3(1, 0, 0);
                break;
            case 'y':
                rotationAxis = new THREE.Vector3(0, 1, 0);
                break;
            case 'z':
                rotationAxis = new THREE.Vector3(0, 0, 1);
                break;
            default:
                console.error("Invalid rotation axis:", axis);
                this.isDeliberateRotation = false;
                return false;
        }
        
        // Apply rotation with quaternions for better consistency
        this.currentBlock.quaternion.multiply(
            new THREE.Quaternion().setFromAxisAngle(rotationAxis, angle)
        );
        
        // Update matrix for collision detection
        this.currentBlock.updateMatrixWorld(true);
        
        // Check for collisions
        if (this._checkCollision(this.currentBlock)) {
            // Revert rotation
            this.currentBlock.quaternion.copy(originalQuaternion);
            this.currentBlock.updateMatrixWorld(true);
            this.isDeliberateRotation = false;
            return false;
        }
        
        // Clear the deliberate rotation flag after a short delay
        setTimeout(() => {
            this.isDeliberateRotation = false;
        }, 100);
        
        // Play rotation sound
        AudioManager.playSFX('rotate');
        return true;
    }

    /**
     * Drop the current block to the lowest possible position
     */
    dropCurrentBlock() {
        if (!this.currentBlock || this.state.isPaused || !this.state.isRunning) return;
        
        // Prevent spam dropping
        if (this.dropCooldown) return;
        this.dropCooldown = true;
        
        let dropDistance = 0;
        let originalPosition = this.currentBlock.position.clone();
        
        // Drop the block until it collides
        while (!this._checkCollision(this.currentBlock)) {
            this.currentBlock.position.y -= 1;
            this.currentBlock.updateMatrixWorld(true);
            dropDistance++;
        }
        
        // Move back up one step since we collided
        this.currentBlock.position.y += 1;
        this.currentBlock.updateMatrixWorld(true);
        
        // Add points for the distance dropped
        if (dropDistance > 1) {
            this._addScore(dropDistance);
        }
        
        // Land the block
        this._landBlock();
        
        // Play drop sound
        AudioManager.playSFX('drop');
        
        // Reset cooldown after a short delay
        setTimeout(() => {
            this.dropCooldown = false;
        }, 300);
    }

    /**
     * Check if a block collides with the pit walls or other placed blocks
     * @param {THREE.Object3D} block - The block to check
     * @returns {boolean} True if collision detected
     * @private
     */
    _checkCollision(block) {
        if (!block) return false;
        
        // Get all the positions of cubes in the block
        const positions = this._getBlockWorldPositions(block);
        
        // Check each position for collisions
        for (const pos of positions) {
            const x = Math.round(pos.x);
            const y = Math.round(pos.y);
            const z = Math.round(pos.z);
            
            // Check pit boundaries
            if (x < 0 || x >= this.settings.pitWidth ||
                z < 0 || z >= this.settings.pitDepth ||
                y < 0 || y >= this.settings.pitHeight) {
                return true;
            }
            
            // Check collision with existing blocks in the pit
            if (this.pit.isOccupied(x, y, z)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Get world positions for all cubes in a block
     * @param {THREE.Object3D} block - The block to get positions for
     * @returns {Array<{x: number, y: number, z: number}>} Array of positions
     * @private
     */
    _getBlockWorldPositions(block) {
        const positions = [];
        
        block.children.forEach(cube => {
            // Get world position for this cube
            const worldPos = new THREE.Vector3();
            cube.getWorldPosition(worldPos);
            
            positions.push({
                x: worldPos.x,
                y: worldPos.y,
                z: worldPos.z
            });
        });
        
        return positions;
    }

    /**
     * Land the current block and integrate it into the pit
     * @private
     */
    _landBlock() {
        if (!this.currentBlock) return;
        
        // Add all cubes from the current block to the pit
        const positions = this._getBlockWorldPositions(this.currentBlock);
        
        for (const pos of positions) {
            const x = Math.round(pos.x);
            const y = Math.round(pos.y);
            const z = Math.round(pos.z);
            
            // Add a cube to the pit at this position
            this.pit.addCube(x, y, z);
        }
        
        // Check for completed layers
        const completedLayers = this.pit.checkCompletedLayers();
        
        if (completedLayers.length > 0) {
            // Remove the completed layers
            this.pit.removeLayers(completedLayers);
            
            // Update score based on completed layers
            this._addScore(completedLayers.length * this.settings.pointsPerLayer);
            
            // Update lines cleared
            this.state.linesCleared += completedLayers.length;
            
            // Check for level up
            if (this.state.linesCleared >= this.state.level * this.settings.linesPerLevel) {
                this._levelUp();
            }
            
            // Trigger callback
            if (this.callbacks.onLayerCleared) {
                this.callbacks.onLayerCleared(completedLayers.length, this.state.linesCleared);
            }
            
            // Play layer clear sound
            AudioManager.playSFX('clear');
        } else {
            // Play land sound
            AudioManager.playSFX('land');
        }
        
        // Spawn the next block
        this._spawnBlock();
    }

    /**
     * Spawn a new block at the top of the pit
     * @private
     */
    _spawnBlock() {
        if (this.debug) console.log("Game._spawnBlock() - Spawning new block");
        
        // Set the current block to the next block
        this.currentBlock = this.nextBlock;
        
        // Get a new next block
        this.nextBlock = this._getNextBlockFromBag();
        
        // Check if we need to refill the bag
        if (this.blockBag.length === 0) {
            this._refillBlockBag();
        }
        
        // If there's no current block, create one
        if (!this.currentBlock) {
            this.currentBlock = this._getNextBlockFromBag();
            this.nextBlock = this._getNextBlockFromBag();
        }
        
        // Position the block at the top center of the pit
        this.currentBlock.position.set(
            Math.floor(this.settings.pitWidth / 2),
            this.settings.pitHeight - 3,
            Math.floor(this.settings.pitDepth / 2)
        );
        
        // Reset rotation
        this.currentBlock.quaternion.identity();
        
        // Update matrix for collision detection
        this.currentBlock.updateMatrixWorld(true);
        
        // Play spawn sound
        AudioManager.playSFX('spawn');
        
        // Check if the block collides immediately (game over)
        if (this._checkCollision(this.currentBlock)) {
            this._gameOver();
            return;
        }
        
        // Trigger next block changed callback
        if (this.callbacks.onNextBlockChanged) {
            this.callbacks.onNextBlockChanged(this.nextBlock);
        }
    }

    /**
     * Get the next block from the bag
     * @returns {THREE.Object3D} The next block
     * @private
     */
    _getNextBlockFromBag() {
        if (this.blockBag.length === 0) {
            this._refillBlockBag();
        }
        
        // Get a random block from the bag
        const blockIndex = Math.floor(Math.random() * this.blockBag.length);
        const blockData = this.blockBag.splice(blockIndex, 1)[0];
        
        return this._createBlockFromData(blockData);
    }

    /**
     * Refill the block bag with all available polycubes
     * @private
     */
    _refillBlockBag() {
        if (this.debug) console.log("Game._refillBlockBag() - Refilling block bag");
        
        // Clear the bag
        this.blockBag = [];
        
        // Get all available polycubes
        const allCubes = PolycubeLibrary.polycubes;
        
        // Add each available polycube to the bag
        allCubes.forEach((polycube, index) => {
            this.blockBag.push({
                id: index,
                data: polycube
            });
        });
        
        if (this.debug) console.log(`Block bag refilled with ${this.blockBag.length} blocks`);
    }

    /**
     * Create a block object from block data
     * @param {Object} blockData - Data for the block to create
     * @returns {THREE.Object3D} The created block
     * @private
     */
    _createBlockFromData(blockData) {
        // Create a new container object for the block
        const block = new THREE.Object3D();
        
        // Get the polycube data
        const polycube = blockData.data;
        
        // Assign ID and color
        block.userData = {
            id: blockData.id,
            colorIndex: blockData.id % 7 // 7 different colors
        };
        
        // Check if polycube has valid data
        if (!polycube) {
            console.error("Invalid polycube data: null or undefined");
            // Create a fallback single cube as a placeholder
            const cube = new THREE.Object3D();
            cube.position.set(0, 0, 0);
            block.add(cube);
            return block;
        }
        
        // Handle different data formats - polycube may have either positions or cubes property
        let cubePositions = [];
        
        if (polycube.positions && Array.isArray(polycube.positions)) {
            cubePositions = polycube.positions;
        } else if (polycube.cubes && Array.isArray(polycube.cubes)) {
            // Convert cubes to positions
            cubePositions = polycube.cubes.map(cube => {
                // Handle different cube formats
                if (typeof cube === 'object') {
                    if (cube.position) {
                        return cube.position;
                    } else if (cube.x !== undefined && cube.y !== undefined && cube.z !== undefined) {
                        return { x: cube.x, y: cube.y, z: cube.z };
                    }
                }
                
                // Default fallback for invalid data
                console.warn("Invalid cube format in polycube:", cube);
                return { x: 0, y: 0, z: 0 };
            });
        } else {
            console.error("Invalid polycube data:", polycube);
            // Create a fallback single cube as a placeholder
            const cube = new THREE.Object3D();
            cube.position.set(0, 0, 0);
            block.add(cube);
            return block;
        }
        
        // Create cubes at each position
        cubePositions.forEach(pos => {
            // Create a placeholder for the cube
            // The actual mesh will be created by the renderer
            const cube = new THREE.Object3D();
            cube.position.set(pos.x, pos.y, pos.z);
            
            // Add the cube to the block
            block.add(cube);
        });
        
        return block;
    }

    /**
     * Add to the score
     * @param {number} points - Points to add
     * @private
     */
    _addScore(points) {
        this.state.score += points;
        
        // Check for high score
        if (this.state.score > this.state.highScore) {
            this.state.highScore = this.state.score;
            this._saveHighScore(this.state.highScore);
        }
        
        // Trigger callback
        if (this.callbacks.onScoreChanged) {
            this.callbacks.onScoreChanged(this.state.score, this.state.highScore);
        }
    }

    /**
     * Increase the level
     * @private
     */
    _levelUp() {
        this.state.level++;
        
        // Increase speed
        this.state.fallSpeed = Math.max(
            100, // Minimum fall speed
            Math.floor(this.settings.initialFallSpeed * Math.pow(this.settings.fallSpeedFactor, this.state.level - 1))
        );
        
        if (this.debug) console.log(`Level up to ${this.state.level}, fall speed now ${this.state.fallSpeed}ms`);
        
        // Trigger callback
        if (this.callbacks.onLevelChanged) {
            this.callbacks.onLevelChanged(this.state.level);
        }
        
        // Play level up sound
        AudioManager.playSFX('levelup');
    }

    /**
     * Handle game over
     * @private
     */
    _gameOver() {
        if (this.debug) console.log("Game._gameOver() - Game over");
        
        this.state.isGameOver = true;
        this.state.isRunning = false;
        
        // Clear the fall timer
        if (this.fallTimer) {
            clearTimeout(this.fallTimer);
            this.fallTimer = null;
        }
        
        // Check for high score
        if (this.state.score > this.state.highScore) {
            this.state.highScore = this.state.score;
            this._saveHighScore(this.state.highScore);
        }
        
        // Trigger callback
        if (this.callbacks.onGameOver) {
            this.callbacks.onGameOver(this.state.score, this.state.highScore);
        }
        
        // Play game over sound
        AudioManager.playSFX('gameover');
    }

    /**
     * Load high score from local storage
     * @returns {number} The high score
     * @private
     */
    _loadHighScore() {
        try {
            const savedScore = localStorage.getItem('cubewellHighScore');
            return savedScore ? parseInt(savedScore, 10) : 0;
        } catch (e) {
            console.error("Error loading high score:", e);
            return 0;
        }
    }

    /**
     * Save high score to local storage
     * @param {number} score - The score to save
     * @private
     */
    _saveHighScore(score) {
        try {
            localStorage.setItem('cubewellHighScore', score.toString());
        } catch (e) {
            console.error("Error saving high score:", e);
        }
    }

    /**
     * Create a fallback polycube library in case the real one fails to load
     * @returns {Object} Simple polycube library 
     * @private
     */
    _createPolycubeFallback() {
        return {
            init: function() {
                this.polycubes = [
                    // Simple cube
                    {
                        name: "Cube",
                        positions: [
                            {x: 0, y: 0, z: 0}
                        ]
                    },
                    // Line of 3 cubes
                    {
                        name: "Line",
                        positions: [
                            {x: -1, y: 0, z: 0},
                            {x: 0, y: 0, z: 0},
                            {x: 1, y: 0, z: 0}
                        ]
                    },
                    // Simple L shape
                    {
                        name: "L-Shape",
                        positions: [
                            {x: 0, y: 0, z: 0},
                            {x: 1, y: 0, z: 0},
                            {x: 0, y: 1, z: 0}
                        ]
                    }
                ];
                console.log("Fallback polycube library initialized with", this.polycubes.length, "shapes");
            },
            polycubes: []
        };
    }
}

export default Game; 