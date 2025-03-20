/**
 * Game.js
 * Handles core game logic including block movement, collision detection,
 * scoring, and game progression
 */

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
        
        // Bind event handlers
        this._bindEvents();
    }
    
    // Initialize or reset the game
    init() {
        // Reset game state
        this.state.score = 0;
        this.state.level = 1;
        this.state.isRunning = false;
        this.state.isGameOver = false;
        this.state.fallSpeed = this.settings.initialFallSpeed;
        
        // Reset the pit
        this.pit.reset();
        
        // Initialize the polycube library
        PolycubeLibrary.init();
        
        // Create a bag of blocks
        this._refillBlockBag();
        
        // Set up initial blocks
        this.nextBlock = this._getNextBlockFromBag();
        
        // Trigger callbacks
        this._triggerCallback('onScoreChanged', this.state.score);
        this._triggerCallback('onLevelChanged', this.state.level);
        this._triggerCallback('onNextBlockChanged', this.nextBlock);
        
        // Update the renderer
        if (this.renderer) {
            this.renderer.init(this.pit, this);
        }
    }
    
    // Start the game
    start() {
        if (this.state.isGameOver) {
            this.init();
        }
        
        this.state.isRunning = true;
        
        // Spawn the first block
        this._spawnBlock();
        
        // Start the fall timer
        this._startFallTimer();
        
        // Start the background music
        AudioManager.startMusic();
    }
    
    // Pause the game
    pause() {
        if (!this.state.isRunning) return;
        
        this.state.isRunning = false;
        clearTimeout(this.fallTimer);
    }
    
    // Resume the game
    resume() {
        if (this.state.isRunning || this.state.isGameOver) return;
        
        this.state.isRunning = true;
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
        if (!this.state.isRunning || !this.currentBlock) return;
        
        switch (key) {
            // Movement
            case 'ArrowLeft':
                this.moveBlock(-1, 0, 0);
                break;
            case 'ArrowRight':
                this.moveBlock(1, 0, 0);
                break;
            case 'ArrowUp':
                this.moveBlock(0, -1, 0);
                break;
            case 'ArrowDown':
                this.moveBlock(0, 1, 0);
                break;
                
            // Rotation
            case 'q':
            case 'Q':
                this.rotateBlock('x', Math.PI/2);
                break;
            case 'w':
            case 'W':
                this.rotateBlock('y', Math.PI/2);
                break;
            case 'e':
            case 'E':
                this.rotateBlock('z', Math.PI/2);
                break;
                
            // Drop
            case ' ':
                this.dropBlock();
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
        
        // Check if the new position is valid
        if (!this.pit.canPlacePolycube(this.currentBlock)) {
            // Revert to the original position
            this.currentBlock.position.x = originalX;
            this.currentBlock.position.y = originalY;
            this.currentBlock.position.z = originalZ;
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
        
        // Rotate the block
        this.currentBlock.rotate(axis, angle);
        
        // Check if the new rotation is valid
        if (!this.pit.canPlacePolycube(this.currentBlock)) {
            // Revert to the original rotation
            this.currentBlock.rotation.x = originalRotation.x;
            this.currentBlock.rotation.y = originalRotation.y;
            this.currentBlock.rotation.z = originalRotation.z;
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
        // Set the current block to the next block
        this.currentBlock = this.nextBlock;
        
        // Get a new next block
        this.nextBlock = this._getNextBlockFromBag();
        
        // Position the block at the top center of the pit
        this.currentBlock.position.x = Math.floor(this.settings.pitWidth / 2) - 1;
        this.currentBlock.position.y = Math.floor(this.settings.pitDepth / 2) - 1;
        this.currentBlock.position.z = this.settings.pitHeight - 1;
        
        // Reset rotation
        this.currentBlock.rotation.x = 0;
        this.currentBlock.rotation.y = 0;
        this.currentBlock.rotation.z = 0;
        
        // Check if the new block can be placed (game over check)
        if (!this.pit.canPlacePolycube(this.currentBlock)) {
            this.gameOver();
            return;
        }
        
        // Trigger callback for next block change
        this._triggerCallback('onNextBlockChanged', this.nextBlock);
        
        // Update the renderer
        if (this.renderer) {
            this.renderer.setCurrentBlock(this.currentBlock);
            this.renderer.updateNextBlockPreview(this.nextBlock);
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
        document.addEventListener('keydown', (event) => {
            this.handleKeyInput(event.key);
        });
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