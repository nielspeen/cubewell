/**
 * Controls - Handle user input for the game
 */
class Controls {
    constructor(game) {
        this.game = game;
        this.keysPressed = {};
        
        // Initialize controls
        this.setupKeyboardControls();
        this.setupTouchControls();
        
        // Mobile detection
        this.isMobile = CONFIG.IS_MOBILE;
        this.showMobileControls(this.isMobile);
    }
    
    /**
     * Set up keyboard event listeners
     */
    setupKeyboardControls() {
        // Key down event
        document.addEventListener('keydown', (event) => {
            // Don't register repeat keydown events
            if (event.repeat) return;
            
            this.keysPressed[event.code] = true;
            
            // Pause/resume with P key (process even when paused)
            if (event.code === 'KeyP' && !this.game.isGameOver) {
                if (this.game.isPaused) {
                    this.game.resume();
                } else {
                    this.game.pause();
                }
                return;
            }
            
            // Only process game controls if game is active (not paused)
            if (!this.game.isPaused && this.game.currentBlock) {
                // Movement
                if (event.code === 'ArrowLeft') {
                    this.game.moveBlock(-1, 0, 0);
                } else if (event.code === 'ArrowRight') {
                    this.game.moveBlock(1, 0, 0);
                } else if (event.code === 'ArrowUp') {
                    this.game.moveBlock(0, 1, 0);
                } else if (event.code === 'ArrowDown') {
                    this.game.moveBlock(0, -1, 0);
                }
                
                // Rotation
                if (event.code === 'KeyQ') {
                    this.game.rotateBlock([1, 0, 0], CONFIG.ROTATION_SPEED);
                } else if (event.code === 'KeyW') {
                    this.game.rotateBlock([0, 1, 0], CONFIG.ROTATION_SPEED);
                } else if (event.code === 'KeyE') {
                    this.game.rotateBlock([0, 0, 1], CONFIG.ROTATION_SPEED);
                } else if (event.code === 'KeyA') {
                    this.game.rotateBlock([1, 0, 0], -CONFIG.ROTATION_SPEED);
                } else if (event.code === 'KeyS') {
                    this.game.rotateBlock([0, 1, 0], -CONFIG.ROTATION_SPEED);
                } else if (event.code === 'KeyD') {
                    this.game.rotateBlock([0, 0, 1], -CONFIG.ROTATION_SPEED);
                }
                
                // Drop (only when game is active)
                if (event.code === 'Space') {
                    this.game.dropBlock();
                }
            } 
            // Handle game restart when game is over
            else if (event.code === 'Space' && this.game.isGameOver) {
                this.game.restart();
            }
            
            // Note: We're removing the auto-resume on space key here
            // because it's now handled in main.js with the welcome screen
        });
        
        // Key up event
        document.addEventListener('keyup', (event) => {
            this.keysPressed[event.code] = false;
        });
    }
    
    /**
     * Set up touch controls for mobile
     */
    setupTouchControls() {
        // Movement buttons
        document.getElementById('move-left').addEventListener('click', () => {
            if (!this.game.isPaused && this.game.currentBlock) {
                this.game.moveBlock(-1, 0, 0);
            }
        });
        
        document.getElementById('move-right').addEventListener('click', () => {
            if (!this.game.isPaused && this.game.currentBlock) {
                this.game.moveBlock(1, 0, 0);
            }
        });
        
        document.getElementById('move-forward').addEventListener('click', () => {
            if (!this.game.isPaused && this.game.currentBlock) {
                this.game.moveBlock(0, 1, 0);
            }
        });
        
        document.getElementById('move-backward').addEventListener('click', () => {
            if (!this.game.isPaused && this.game.currentBlock) {
                this.game.moveBlock(0, -1, 0);
            }
        });
        
        // Rotation buttons
        document.getElementById('rotate-x').addEventListener('click', () => {
            if (!this.game.isPaused && this.game.currentBlock) {
                this.game.rotateBlock([1, 0, 0], CONFIG.ROTATION_SPEED);
            }
        });
        
        document.getElementById('rotate-y').addEventListener('click', () => {
            if (!this.game.isPaused && this.game.currentBlock) {
                this.game.rotateBlock([0, 1, 0], CONFIG.ROTATION_SPEED);
            }
        });
        
        document.getElementById('rotate-z').addEventListener('click', () => {
            if (!this.game.isPaused && this.game.currentBlock) {
                this.game.rotateBlock([0, 0, 1], CONFIG.ROTATION_SPEED);
            }
        });
        
        // Drop button
        document.getElementById('drop-btn').addEventListener('click', () => {
            if (!this.game.isPaused && this.game.currentBlock) {
                this.game.dropBlock();
            } else if (this.game.isGameOver) {
                this.game.restart();
            }
            // Removed auto-resume as it's handled in main.js
        });
        
        // Pause button
        document.getElementById('pause-btn').addEventListener('click', () => {
            if (!this.game.isGameOver) {
                if (this.game.isPaused) {
                    this.game.resume();
                } else {
                    this.game.pause();
                }
            }
        });
        
        // Game canvas click - removed auto-resume functionality
        
        // Restart button
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.game.restart();
        });
    }
    
    /**
     * Show or hide mobile controls
     */
    showMobileControls(show) {
        const mobileControls = document.getElementById('mobile-controls');
        if (show) {
            mobileControls.classList.remove('hidden');
        } else {
            mobileControls.classList.add('hidden');
        }
    }
    
    /**
     * Update controls (check for held keys)
     */
    update() {
        // No continuous key press handling needed currently
    }
} 