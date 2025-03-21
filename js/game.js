/**
 * Game.js
 * Handles core game logic including block movement, collision detection,
 * scoring, and game progression
 */

import Pit from './pit.js';
import PolycubeLibrary from './polycubes.js';
import AudioManager from './audio.js';

class Game {
    constructor(renderer) {
        // Game settings
        this.settings = {
            pitWidth: 5,
            pitDepth: 5,
            pitHeight: 10,
            initialFallSpeed: 1000, // milliseconds per cube
            speedIncreaseRate: 0.9, // multiply by this after each level
            pointsPerBlock: 10,
            pointsPerLayer: 100,
            levelUpScore: 500 // Score increment required for level up
        };
        
        // Game state
        this.state = {
            score: 0,
            level: 1,
            isRunning: false,
            isGameOver: false,
            isPaused: false,
            fallSpeed: this.settings.initialFallSpeed
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
            this.settings.pitHeight
        );
        
        // Reference to the renderer
        this.renderer = renderer;
        
        // Event callbacks
        this.callbacks = {
            onScoreChanged: null,
            onLevelChanged: null,
            onGameOver: null,
            onLayerCleared: null,
            onNextBlockChanged: null
        };
        
        // Debug mode
        this.debug = true;
        
        // Bind event handlers
        this._bindEvents();
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
        this.state.isRunning = false;
        this.state.isGameOver = false;
        this.state.isPaused = false;
        this.state.fallSpeed = this.settings.initialFallSpeed;
        
        // Reset the pit
        this.pit.reset();
        
        // Initialize the polycube library
        PolycubeLibrary.init();
        
        // Create a bag of blocks
        this._refillBlockBag();
        
        // Set up initial blocks
        this.nextBlock = this._getNextBlockFromBag();
        
        if (this.debug) console.log("Initial next block:", this.nextBlock);
        
        // Trigger callbacks
        this._triggerCallback('onScoreChanged', this.state.score);
        this._triggerCallback('onLevelChanged', this.state.level);
        this._triggerCallback('onNextBlockChanged', this.nextBlock);
        
        // Update the renderer
        if (this.renderer) {
            if (this.debug) console.log("Initializing renderer");
            this.renderer.init(this.pit, this);
        } else {
            if (this.debug) console.error("Renderer is not initialized!");
        }
    }
    
    // Start the game
    start() {
        if (this.debug) console.log("Game.start() - Starting game");
        
        if (this.state.isGameOver) {
            this.init();
        }
        
        // Set game state
        this.state.isRunning = false;  // Start in paused state
        this.state.isPaused = true;    // Set paused flag
        this.state.isGameOver = false;
        
        // Make sure the pit is clear of any blocks
        if (this.pit.getFilledPositions().length > 0) {
            console.log("Pit has filled positions at start - clearing pit");
            this.pit.reset();
        }
        
        // Spawn the first block if we don't have one
        if (!this.currentBlock) {
            this._spawnBlock();
        }
        
        // Make sure the block is visible in the renderer
        if (this.renderer && this.currentBlock) {
            this.renderer.setCurrentBlock(this.currentBlock);
            this.renderer.updatePit(this.pit);
        }
        
        // Don't start the fall timer yet - will be started when user presses SPACE
        
        // Start the background music
        try {
            AudioManager.startMusic();
        } catch (e) {
            console.warn("Could not start music:", e);
        }
        
        if (this.debug) {
            console.log("Game started in paused state:", {
                running: this.state.isRunning,
                paused: this.state.isPaused,
                gameOver: this.state.isGameOver,
                block: this.currentBlock ? "present" : "missing",
                position: this.currentBlock ? this.currentBlock.position : "N/A"
            });
        }
    }
    
    // Pause the game
    pause() {
        if (!this.state.isRunning) return;
        
        this.state.isRunning = false;
        this.state.isPaused = true;
        clearTimeout(this.fallTimer);
    }
    
    // Resume the game
    resume() {
        if (this.state.isRunning || this.state.isGameOver) return;
        
        this.state.isRunning = true;
        this.state.isPaused = false;
        this._startFallTimer();
    }
    
    // End the game
    gameOver() {
        this.state.isRunning = false;
        this.state.isGameOver = true;
        
        clearTimeout(this.fallTimer);
        
        // Play game over sound
        AudioManager.playGameOver();
        
        // Stop the music
        AudioManager.stopMusic();
        
        // Trigger callback
        this._triggerCallback('onGameOver', this.state.score);
    }
    
    // Handle key input
    handleKeyInput(key) {
        console.log(`Game.handleKeyInput: ${key}, isRunning: ${this.state.isRunning}, isPaused: ${this.state.isPaused}, isGameOver: ${this.state.isGameOver}`);
        
        // Space key has two behaviors:
        // 1. In paused initial state - start the game (handled by main.js)
        // 2. In running state - drop the block
        if (key === ' ') {
            if (this.state.isPaused && !this.state.isRunning) {
                console.log("Space key in paused initial state - handled by main.js");
                return;
            } else if (this.state.isRunning && this.currentBlock) {
                console.log("Space key in running state - dropping block");
                this.dropBlock();
                return;
            }
        }
        
        // For all other keys - only process if the game is running
        if (!this.state.isRunning) {
            console.log("Game is not running, ignoring key input");
            return;
        }
        
        if (!this.currentBlock) {
            console.log("No current block, ignoring key input");
            return;
        }
        
        if (this.debug) console.log(`Key press: ${key}`);
        
        switch (key) {
            // Movement - Corrected for top-down orientation
            case 'ArrowLeft':
                console.log("Moving left");
                this.moveBlock(-1, 0, 0);
                break;
            case 'ArrowRight':
                console.log("Moving right");
                this.moveBlock(1, 0, 0);
                break;
            case 'ArrowUp':
                console.log("Moving forward (away from viewer)");
                this.moveBlock(0, 1, 0);  // Positive Y is away from viewer in top-down view
                break;
            case 'ArrowDown':
                console.log("Moving backward (toward viewer)");
                this.moveBlock(0, -1, 0);  // Negative Y is toward viewer in top-down view
                break;
                
            // Rotation
            case 'q':
            case 'Q':
                console.log("Rotating X (reversed direction)");
                this.rotateBlock('x', -Math.PI/2);  // Reversed direction
                break;
            case 'w':
            case 'W':
                console.log("Rotating Y");
                this.rotateBlock('y', Math.PI/2);
                break;
            case 'e':
            case 'E':
                console.log("Rotating Z (reversed direction)");
                this.rotateBlock('z', -Math.PI/2);  // Reversed direction
                break;
        }
    }
    
    // Move the current block
    moveBlock(dx, dy, dz) {
        if (!this.currentBlock || !this.state.isRunning) return false;
        
        // Save the original position
        const originalX = this.currentBlock.position.x;
        const originalY = this.currentBlock.position.y;
        const originalZ = this.currentBlock.position.z;
        
        // Move the block
        this.currentBlock.move(dx, dy, dz);
        
        if (this.debug) console.log(`Moving block to: ${this.currentBlock.position.x}, ${this.currentBlock.position.y}, ${this.currentBlock.position.z}`);
        
        // Check if the new position is valid
        if (!this.pit.canPlacePolycube(this.currentBlock)) {
            // Revert to the original position
            this.currentBlock.position.x = originalX;
            this.currentBlock.position.y = originalY;
            this.currentBlock.position.z = originalZ;
            
            if (this.debug) console.log(`Invalid move, reverting to: ${originalX}, ${originalY}, ${originalZ}`);
            return false;
        }
        
        // Play move sound
        AudioManager.playMove();
        
        // Update in the renderer
        if (this.renderer) {
            this.renderer.updateCurrentBlock(this.currentBlock);
        }
        
        return true;
    }
    
    // Rotate the current block
    rotateBlock(axis, angle) {
        if (!this.currentBlock || !this.state.isRunning) return false;
        
        // Save the original rotation
        const originalRotation = { 
            x: this.currentBlock.rotation.x,
            y: this.currentBlock.rotation.y,
            z: this.currentBlock.rotation.z
        };
        
        // For debugging, log the pre-rotation state
        if (this.debug) {
            console.log(`Pre-rotation: axis=${axis}, angle=${angle}, position:`, 
                JSON.stringify(this.currentBlock.position), 
                "rotation:", JSON.stringify(this.currentBlock.rotation));
        }
        
        // Rotate the block
        this.currentBlock.rotate(axis, angle);
        
        if (this.debug) console.log(`Rotating block on ${axis} axis by ${angle}`);
        
        // Check if the new rotation is valid
        if (!this.pit.canPlacePolycube(this.currentBlock)) {
            // Revert to the original rotation
            this.currentBlock.rotation.x = originalRotation.x;
            this.currentBlock.rotation.y = originalRotation.y;
            this.currentBlock.rotation.z = originalRotation.z;
            
            if (this.debug) console.log(`Invalid rotation, reverting`);
            
            // Try a slight position adjustment if it's the Z-axis (E key) and negative rotation
            if (axis === 'z' && angle < 0) {
                // Save current position
                const origPos = {...this.currentBlock.position};
                
                // Try adjusting the position slightly then rotate
                const adjustments = [
                    {x: 0, y: 0, z: 1},   // Try moving up one space
                    {x: -1, y: 0, z: 0},   // Try moving left
                    {x: 1, y: 0, z: 0},    // Try moving right
                    {x: 0, y: 1, z: 0},    // Try moving forward
                    {x: 0, y: -1, z: 0}    // Try moving backward
                ];
                
                for (const adj of adjustments) {
                    // Move to adjusted position
                    this.currentBlock.position.x += adj.x;
                    this.currentBlock.position.y += adj.y;
                    this.currentBlock.position.z += adj.z;
                    
                    // Try rotation again
                    this.currentBlock.rotate(axis, angle);
                    
                    if (this.pit.canPlacePolycube(this.currentBlock)) {
                        // Success! Keep this position and rotation
                        if (this.debug) console.log(`Found valid rotation after position adjustment: ${JSON.stringify(adj)}`);
                        
                        // Play rotate sound
                        AudioManager.playRotate();
                        
                        // Update in the renderer
                        if (this.renderer) {
                            this.renderer.updateCurrentBlock(this.currentBlock);
                        }
                        
                        return true;
                    }
                    
                    // Reset position and rotation for next try
                    this.currentBlock.position.x = origPos.x;
                    this.currentBlock.position.y = origPos.y;
                    this.currentBlock.position.z = origPos.z;
                    this.currentBlock.rotation.x = originalRotation.x;
                    this.currentBlock.rotation.y = originalRotation.y;
                    this.currentBlock.rotation.z = originalRotation.z;
                }
            }
            
            return false;
        }
        
        // Play rotate sound
        AudioManager.playRotate();
        
        // Update in the renderer
        if (this.renderer) {
            this.renderer.updateCurrentBlock(this.currentBlock);
        }
        
        return true;
    }
    
    // Quickly drop the block to the bottom
    dropBlock() {
        if (!this.currentBlock || !this.state.isRunning) return;
        
        if (this.debug) console.log(`Dropping block`);
        
        // Play drop sound
        AudioManager.playDrop();
        
        // Keep moving the block down until it can't move anymore
        while (this.moveBlock(0, 0, -1)) {
            // Continue moving down
        }
        
        // The block has reached the bottom, land it immediately
        this._landBlock();
    }
    
    // Automatically move the block down one step
    _autoFall() {
        if (!this.state.isRunning || !this.currentBlock) return;
        
        // Try to move the block down
        if (!this.moveBlock(0, 0, -1)) {
            // Block can't move down anymore, land it
            this._landBlock();
        } else {
            // Continue falling
            this._startFallTimer();
        }
    }
    
    // Start the fall timer
    _startFallTimer() {
        clearTimeout(this.fallTimer);
        this.fallTimer = setTimeout(() => this._autoFall(), this.state.fallSpeed);
    }
    
    // Land the current block and handle consequences
    _landBlock() {
        if (!this.currentBlock) return;
        
        if (this.debug) console.log(`Landing block at: ${this.currentBlock.position.x}, ${this.currentBlock.position.y}, ${this.currentBlock.position.z}`);
        
        // Play landing sound
        AudioManager.playLand();
        
        // Add the block to the pit
        this.pit.placePolycube(this.currentBlock);
        
        // Update score for placing a block
        this._updateScore(this.settings.pointsPerBlock);
        
        // Check for completed layers
        const layersCleared = this.pit.checkAndClearLayers();
        
        if (layersCleared > 0) {
            // Play clear sound
            AudioManager.playClear();
            
            // Calculate score for clearing layers
            // Formula: 100 * layers * (layers + 1) / 2
            // This gives bonus points for multiple layers: 1 layer = 100, 2 layers = 300, 3 layers = 600, etc.
            const layerScore = this.settings.pointsPerLayer * layersCleared * (layersCleared + 1) / 2;
            this._updateScore(layerScore);
            
            // Trigger callback for layer clear
            this._triggerCallback('onLayerCleared', layersCleared);
        }
        
        // Update the renderer with the static blocks
        if (this.renderer) {
            this.renderer.updatePit(this.pit);
        }
        
        // Check if game is over
        if (this.pit.isGameOver()) {
            this.gameOver();
            return;
        }
        
        // Spawn the next block
        this._spawnBlock();
    }
    
    // Spawn a new block at the top of the pit
    _spawnBlock() {
        if (this.debug) console.log("Spawning new block");
        
        // Check if we actually have a next block, and if not, create one
        if (!this.nextBlock) {
            this.nextBlock = this._getNextBlockFromBag();
            if (this.debug) console.log("Created new next block:", this.nextBlock);
        }
        
        // Set the current block to the next block
        this.currentBlock = this.nextBlock;
        
        // Get a new next block
        this.nextBlock = this._getNextBlockFromBag();
        
        // Find the highest z-coordinate in the block cubes
        let maxZ = 0;
        this.currentBlock.cubes.forEach(cube => {
            if (cube.z > maxZ) maxZ = cube.z;
        });
        
        // Position the block at the top center of the pit with padding
        // Adjust X and Y to be slightly more centered if needed
        this.currentBlock.position.x = Math.floor(this.settings.pitWidth / 2) - 1;
        this.currentBlock.position.y = Math.floor(this.settings.pitDepth / 2) - 1;
        
        // Make sure the highest point of the block is at the top of the pit
        this.currentBlock.position.z = this.settings.pitHeight - 1 - maxZ;
        
        if (this.debug) console.log(`Adjusted spawn position for maxZ=${maxZ}: ${this.currentBlock.position.x}, ${this.currentBlock.position.y}, ${this.currentBlock.position.z}`);
        
        // Reset rotation
        this.currentBlock.rotation.x = 0;
        this.currentBlock.rotation.y = 0;
        this.currentBlock.rotation.z = 0;
        
        // Important: Update the renderer with the current and next blocks BEFORE any movement
        if (this.renderer) {
            console.log("Updating renderer with new blocks");
            this.renderer.setCurrentBlock(this.currentBlock);
            this.renderer.updateNextBlockPreview(this.nextBlock);
        }
        
        if (this.debug) {
            console.log(`New block positioned at: ${this.currentBlock.position.x}, ${this.currentBlock.position.y}, ${this.currentBlock.position.z}`);
            console.log(`Block type: ${this.currentBlock.name}, cubes: ${this.currentBlock.cubes.length}`);
            console.log(`Block color index: ${this.currentBlock.colorIndex}`);
        }
        
        // Check if we can actually place the block at the start position
        if (!this.pit.canPlacePolycube(this.currentBlock)) {
            console.error("Cannot place initial block - pit may be too full or block position invalid!");
            
            // Try repositioning higher up
            for (let attempts = 0; attempts < 3; attempts++) {
                // Move one unit higher
                this.currentBlock.position.z += 1;
                
                // Check if this position works
                if (this.pit.canPlacePolycube(this.currentBlock)) {
                    console.log(`Block repositioned higher to z=${this.currentBlock.position.z} and now fits!`);
                    
                    // Update renderer with new position
                    if (this.renderer) {
                        this.renderer.setCurrentBlock(this.currentBlock);
                    }
                    
                    return; // Success!
                }
            }
            
            // If we get here, even raising the block didn't help
            // But don't trigger game over if we haven't even started yet (score is still 0)
            if (this.state.score > 0) {
                // This is a real game over situation
                console.error("Game over - cannot place initial block even after repositioning!");
                this.gameOver();
            } else {
                // We're just starting, so clear the pit and try again
                console.log("First block couldn't be placed. Clearing pit and trying again...");
                this.pit.reset();
                
                // Reposition the block at the top center again
                this.currentBlock.position.x = Math.floor(this.settings.pitWidth / 2) - 1;
                this.currentBlock.position.y = Math.floor(this.settings.pitDepth / 2) - 1;
                this.currentBlock.position.z = this.settings.pitHeight - 1;
                
                // Update the renderer
                if (this.renderer) {
                    this.renderer.setCurrentBlock(this.currentBlock);
                    this.renderer.updatePit(this.pit);
                }
            }
        }
        
        // Trigger callback for next block change
        this._triggerCallback('onNextBlockChanged', this.nextBlock);
        
        // Update the renderer with both blocks
        if (this.renderer) {
            if (this.debug) console.log("Updating renderer with new blocks");
            
            // Set both blocks in renderer
            this.renderer.setCurrentBlock(this.currentBlock);
            this.renderer.updateNextBlockPreview(this.nextBlock);
            
            // Force an update of both renderer scenes
            this.renderer.renderer.render(this.renderer.scene, this.renderer.camera);
            this.renderer.previewRenderer.render(this.renderer.previewScene, this.renderer.previewCamera);
        } else {
            if (this.debug) console.error("Renderer not available for new block");
        }
        
        // Start the fall timer
        this._startFallTimer();
    }
    
    // Get the next block from the bag
    _getNextBlockFromBag() {
        // Refill the bag if it's empty
        if (this.blockBag.length === 0) {
            this._refillBlockBag();
        }
        
        // Take a block from the bag
        return this.blockBag.pop();
    }
    
    // Refill the block bag with a shuffled set of all block types
    _refillBlockBag() {
        this.blockBag = PolycubeLibrary.createBag();
        if (this.debug) console.log(`Refilled block bag with ${this.blockBag.length} blocks`);
    }
    
    // Update the score and check for level up
    _updateScore(points) {
        this.state.score += points;
        
        // Check for level up
        const newLevel = Math.floor(this.state.score / this.settings.levelUpScore) + 1;
        
        if (newLevel > this.state.level) {
            this._levelUp(newLevel);
        }
        
        // Trigger callback
        this._triggerCallback('onScoreChanged', this.state.score);
    }
    
    // Handle level up
    _levelUp(newLevel) {
        this.state.level = newLevel;
        
        // Increase fall speed
        this.state.fallSpeed = this.settings.initialFallSpeed * 
                               Math.pow(this.settings.speedIncreaseRate, newLevel - 1);
        
        // Trigger callback
        this._triggerCallback('onLevelChanged', this.state.level);
    }
    
    // Bind event handlers for keyboard input
    _bindEvents() {
        if (this.debug) console.log("Game: Binding keyboard events");
        
        // IMPORTANT: We're NOT binding keyboard events here anymore
        // This is now handled by main.js to prevent duplication
        
        // Just set up the bound function for use by main.js
        this._handleKeyDown = (event) => {
            if (this.debug) console.log(`Game received key: ${event.key}`);
            this.handleKeyInput(event.key);
        };
    }
    
    // Trigger a callback if it exists
    _triggerCallback(callbackName, data) {
        if (this.callbacks[callbackName]) {
            this.callbacks[callbackName](data);
        }
    }
    
    // Set a callback function
    setCallback(callbackName, callback) {
        if (callbackName in this.callbacks) {
            this.callbacks[callbackName] = callback;
        }
    }
}

export default Game; 