/**
 * UI.js
 * Handles the user interface, menu screens, settings, and mobile controls
 */

import AudioManager from './audio.js';

const UI = {
    // Debug mode
    debug: true,
    
    // Game reference
    game: null,
    
    // Store UI elements
    elements: {
        // Screens
        menuScreen: null,
        gameScreen: null,
        gameOverScreen: null,
        highScoresScreen: null,
        settingsScreen: null,
        
        // Game info
        scoreDisplay: null,
        levelDisplay: null,
        finalScoreDisplay: null,
        highScoreDisplay: null,
        lastKeyDisplay: null,
        gameStateDisplay: null,
        gameOverMessage: null,
        
        // Buttons
        startGameBtn: null,
        highScoresBtn: null,
        settingsBtn: null,
        restartGameBtn: null,
        backToMenuBtn: null,
        backBtns: null,
        
        // Mobile controls
        mobileControls: null,
        moveBtns: {},
        rotateBtns: {},
        dropBtn: null,
        
        // Settings
        musicVolumeSlider: null,
        sfxVolumeSlider: null,
        difficultySelect: null,
        
        // High scores
        highScoresList: null
    },
    
    // Set the game instance
    setGame(game) {
        if (this.debug) console.log("UI: Setting game instance");
        this.game = game;
    },
    
    // Initialize the UI
    init() {
        if (this.debug) console.log("UI: Initializing");
        this._cacheElements();
        this._bindEvents();
        this._loadSettings();
        this._loadHighScores();
        
        // Start game immediately
        this._startGame();
    },
    
    // Cache all the DOM elements for quick access
    _cacheElements() {
        // Initialize elements with default values
        this.elements = {
            // Game screen
            gameScreen: document.getElementById('game-screen'),
            
            // Status information 
            scoreDisplay: document.getElementById('score'),
            levelDisplay: document.getElementById('level'),
            highScoreDisplay: document.getElementById('high-score'),
            lastKeyDisplay: document.getElementById('last-key-pressed'),
            gameStateDisplay: document.getElementById('game-running-status'),
            gameOverMessage: document.getElementById('game-over-message'),
            
            // Position display (may not exist in simplified UI)
            positionDisplay: document.getElementById('position'),
            
            // Settings
            musicVolumeSlider: document.getElementById('music-volume'),
            sfxVolumeSlider: document.getElementById('sfx-volume'),
            difficultySelect: document.getElementById('difficulty'),
            
            // Mobile controls (might not exist)
            moveBtns: {
                left: document.getElementById('move-left'),
                right: document.getElementById('move-right'),
                forward: document.getElementById('move-forward'),
                backward: document.getElementById('move-backward')
            },
            rotateBtns: {
                x: document.getElementById('rotate-x'),
                y: document.getElementById('rotate-y'),
                z: document.getElementById('rotate-z')
            },
            dropBtn: document.getElementById('drop-button')
        };
        
        // Debug log of found elements
        if (this.debug) {
            console.log("UI elements cached:", {
                gameScreen: !!this.elements.gameScreen,
                scoreDisplay: !!this.elements.scoreDisplay,
                levelDisplay: !!this.elements.levelDisplay,
                highScoreDisplay: !!this.elements.highScoreDisplay,
                gameStateDisplay: !!this.elements.gameStateDisplay
            });
        }
    },
    
    // Bind event handlers
    _bindEvents() {
        // Menu buttons - Add null checks for all menu elements
        if (this.elements.startGameBtn) {
            this.elements.startGameBtn.addEventListener('click', () => this._startGame());
        }
        
        // Try to find the new buttons by their IDs
        const showControlsBtn = document.getElementById('show-controls');
        const showHighScoresBtn = document.getElementById('show-high-scores');
        
        if (showControlsBtn) {
            showControlsBtn.addEventListener('click', () => this._showScreen(this.elements.settingsScreen));
        } else if (this.elements.settingsBtn) {
            // Fallback to old button if exists
            this.elements.settingsBtn.addEventListener('click', () => this._showScreen(this.elements.settingsScreen));
        }
        
        if (showHighScoresBtn) {
            showHighScoresBtn.addEventListener('click', () => this._showScreen(this.elements.highScoresScreen));
        } else if (this.elements.highScoresBtn) {
            // Fallback to old button if exists
            this.elements.highScoresBtn.addEventListener('click', () => this._showScreen(this.elements.highScoresScreen));
        }
        
        // Game over buttons
        if (this.elements.restartGameBtn) {
            this.elements.restartGameBtn.addEventListener('click', () => this._startGame());
        }
        
        if (this.elements.backToMenuBtn) {
            this.elements.backToMenuBtn.addEventListener('click', () => this._showScreen(this.elements.menuScreen));
        }
        
        // Back buttons
        if (this.elements.backBtns) {
            this.elements.backBtns.forEach(btn => {
                btn.addEventListener('click', () => this._showScreen(this.elements.menuScreen));
            });
        }
        
        // Keyboard pause/resume
        document.addEventListener('keydown', (event) => {
            if (event.key === 'p' || event.key === 'P') {
                this._togglePause();
            }
            
            // R key to restart
            if (event.key === 'r' || event.key === 'R') {
                this.restartGame();
            }
            
            // M key to toggle music
            if (event.key === 'm' || event.key === 'M') {
                this.toggleMusic();
            }
        });
        
        // Settings changes
        if (this.elements.musicVolumeSlider) {
            this.elements.musicVolumeSlider.addEventListener('input', () => {
                const volume = this.elements.musicVolumeSlider.value / 100;
                if (AudioManager.initialized) {
                    AudioManager.setMusicVolume(volume);
                }
                this._saveSettings();
            });
        }
        
        if (this.elements.sfxVolumeSlider) {
            this.elements.sfxVolumeSlider.addEventListener('input', () => {
                const volume = this.elements.sfxVolumeSlider.value / 100;
                if (AudioManager.initialized) {
                    AudioManager.setSfxVolume(volume);
                }
                this._saveSettings();
            });
        }
        
        if (this.elements.difficultySelect) {
            this.elements.difficultySelect.addEventListener('change', () => {
                this._saveSettings();
                this._applyDifficulty();
            });
        }
        
        // Mobile controls - Add null checks for these elements
        if (this.elements.moveBtns && this.elements.moveBtns.left) {
            this.elements.moveBtns.left.addEventListener('click', () => this.game.moveBlock(-1, 0, 0));
        }
        
        if (this.elements.moveBtns && this.elements.moveBtns.right) {
            this.elements.moveBtns.right.addEventListener('click', () => this.game.moveBlock(1, 0, 0));
        }
        
        if (this.elements.moveBtns && this.elements.moveBtns.forward) {
            this.elements.moveBtns.forward.addEventListener('click', () => this.game.moveBlock(0, -1, 0));
        }
        
        if (this.elements.moveBtns && this.elements.moveBtns.backward) {
            this.elements.moveBtns.backward.addEventListener('click', () => this.game.moveBlock(0, 1, 0));
        }
        
        if (this.elements.rotateBtns && this.elements.rotateBtns.x) {
            this.elements.rotateBtns.x.addEventListener('click', () => this.game.rotateBlock('x', Math.PI/2));
        }
        
        if (this.elements.rotateBtns && this.elements.rotateBtns.y) {
            this.elements.rotateBtns.y.addEventListener('click', () => this.game.rotateBlock('y', Math.PI/2));
        }
        
        if (this.elements.rotateBtns && this.elements.rotateBtns.z) {
            this.elements.rotateBtns.z.addEventListener('click', () => this.game.rotateBlock('z', Math.PI/2));
        }
        
        if (this.elements.dropBtn) {
            this.elements.dropBtn.addEventListener('click', () => this.game.dropBlock());
        }
    },
    
    // Start or restart the game
    _startGame() {
        if (this.debug) console.log("UI: Starting game");
        
        // Apply difficulty settings
        this._applyDifficulty();
        
        // Initialize and start the game
        if (this.game) {
            // Always initialize first (resets the game state)
            this.game.init();
            
            // Ensure we have a current block (this may be missing on first load)
            if (!this.game.currentBlock) {
                console.log("UI: No current block after init - spawning one");
                this.game._spawnBlock();
            }
            
            // Then start the game - this will put it in paused state
            this.game.start();
            
            // Extra check to ensure proper paused state
            this.game.state.isRunning = false;
            this.game.state.isPaused = true;
            this.game.state.isGameOver = false;
            
            // Update UI to show paused state with start message
            if (this.elements.gameStateDisplay) {
                this.elements.gameStateDisplay.textContent = "Paused";
                this.elements.gameStateDisplay.style.color = "#FFA500";
            }
            
            // No longer using the old game-over-message
            // Just use the new centered start message
            const startMessage = document.getElementById('start-message');
            if (startMessage) {
                startMessage.textContent = 'Press SPACE to Start';
                startMessage.style.display = 'block';
            }
            
            // Reset the score display
            if (this.elements.scoreDisplay) {
                this.elements.scoreDisplay.textContent = "0";
            }
            
            // Reset the level display
            if (this.elements.levelDisplay) {
                this.elements.levelDisplay.textContent = "1";
            }
            
            // Add paused class to game screen to show overlay
            const gameScreen = document.getElementById('game-screen');
            if (gameScreen) {
                gameScreen.classList.add('paused');
            }
            
            // Log the state
            console.log("Game fully initialized and ready:", {
                running: this.game.state.isRunning,
                paused: this.game.state.isPaused,
                gameOver: this.game.state.isGameOver,
                hasBlock: !!this.game.currentBlock
            });
        }
        
        // Make sure audio context is resumed (needed for browsers that suspend it)
        if (AudioManager.context && AudioManager.context.state === 'suspended') {
            AudioManager.context.resume();
        }
    },
    
    // Apply the selected difficulty
    _applyDifficulty() {
        if (!this.game || !this.elements.difficultySelect) return;
        
        const difficulty = this.elements.difficultySelect.value;
        
        switch (difficulty) {
            case 'easy':
                // Slower falling speed, slower increase rate
                this.game.settings.initialFallSpeed = 1500; // 1.5 seconds per cube (slower)
                this.game.settings.speedIncreaseRate = 0.92; // Slower speed increase rate
                break;
            case 'medium':
                // Default settings
                this.game.settings.initialFallSpeed = 1000; // 1 second per cube
                this.game.settings.speedIncreaseRate = 0.9; 
                break;
            case 'hard':
                // Faster falling speed, faster increase rate
                this.game.settings.initialFallSpeed = 800; // 0.8 seconds per cube (faster)
                this.game.settings.speedIncreaseRate = 0.85; // Faster speed increase rate
                break;
        }
        
        // If the game is already running, update the current fall speed
        if (this.game.state && this.game.state.level > 0) {
            this.game.state.fallSpeed = this.game.settings.initialFallSpeed * 
                Math.pow(this.game.settings.speedIncreaseRate, this.game.state.level - 1);
            
            if (this.debug) {
                console.log(`Difficulty changed to ${difficulty}. New fall speed: ${this.game.state.fallSpeed}ms`);
            }
        }
    },
    
    // Toggle pause state
    _togglePause() {
        if (!this.game) return;
        
        if (this.game.state.isRunning) {
            this.game.pause();
            if (this.elements.gameStateDisplay) {
                this.elements.gameStateDisplay.textContent = "Paused";
            }
            
            // Add paused class to show overlay
            const gameScreen = document.getElementById('game-screen');
            if (gameScreen) {
                gameScreen.classList.add('paused');
            }
            
            // Show the pause message
            const startMessage = document.getElementById('start-message');
            if (startMessage) {
                startMessage.textContent = 'Game Paused - Press SPACE to Resume';
                startMessage.style.display = 'block';
            }
            
        } else if (this.game.state.isPaused) {
            this.game.resume();
            if (this.elements.gameStateDisplay) {
                this.elements.gameStateDisplay.textContent = "Running";
            }
            
            // Remove paused class to hide overlay
            const gameScreen = document.getElementById('game-screen');
            if (gameScreen) {
                gameScreen.classList.remove('paused');
            }
            
            // Hide the pause message
            const startMessage = document.getElementById('start-message');
            if (startMessage) {
                startMessage.style.display = 'none';
            }
        }
    },
    
    // Show the game over screen
    _showGameOver(score) {
        // Update game state
        if (this.elements.gameStateDisplay) {
            this.elements.gameStateDisplay.textContent = "Game Over";
            this.elements.gameStateDisplay.style.color = "#FF5252";
        }
        
        // Show game over message
        if (this.elements.gameOverMessage) {
            this.elements.gameOverMessage.textContent = "GAME OVER";
            this.elements.gameOverMessage.style.display = "block";
            this.elements.gameOverMessage.style.color = "#FF5252";
        }
        
        // Show the centered game over message
        const startMessage = document.getElementById('start-message');
        if (startMessage) {
            startMessage.textContent = 'GAME OVER - Press SPACE to Restart';
            startMessage.style.display = 'block';
            
            // Add a red border for game over
            startMessage.style.border = '3px solid #FF5252';
            startMessage.style.color = '#FF5252';
        }
        
        // Add the overlay effect
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            gameScreen.classList.add('paused');
        }
        
        // Save the score
        this._saveHighScore(score);
        this._updateHighScoreDisplay();
    },
    
    // Update the score display
    _updateScore(score) {
        if (this.elements.scoreDisplay) {
            this.elements.scoreDisplay.textContent = score;
        }
    },
    
    // Update the level display
    _updateLevel(level) {
        if (this.elements.levelDisplay) {
            this.elements.levelDisplay.textContent = level;
        }
    },
    
    // Show a specific screen and hide others
    _showScreen(screen) {
        // Only try to show the screen if it exists
        if (!screen) {
            console.warn("Attempted to show a screen that doesn't exist");
            return;
        }
        
        this._hideAllScreens();
        screen.classList.remove('hidden');
    },
    
    // Hide all screens
    _hideAllScreens() {
        // Since we've removed most screens, just make sure our main screen is visible
        if (this.elements.gameScreen) {
            this.elements.gameScreen.classList.remove('hidden');
        }
        
        // Add null checks for any remaining screens
        if (this.elements.menuScreen) {
            this.elements.menuScreen.classList.add('hidden');
        }
        if (this.elements.gameOverScreen) {
            this.elements.gameOverScreen.classList.add('hidden');
        }
        if (this.elements.highScoresScreen) {
            this.elements.highScoresScreen.classList.add('hidden');
        }
        if (this.elements.settingsScreen) {
            this.elements.settingsScreen.classList.add('hidden');
        }
    },
    
    // Save settings to localStorage
    _saveSettings() {
        const settings = {
            musicVolume: this.elements.musicVolumeSlider ? this.elements.musicVolumeSlider.value : 50,
            sfxVolume: this.elements.sfxVolumeSlider ? this.elements.sfxVolumeSlider.value : 70,
            difficulty: this.elements.difficultySelect ? this.elements.difficultySelect.value : 'medium'
        };
        
        localStorage.setItem('cubewell_settings', JSON.stringify(settings));
    },
    
    // Load settings from localStorage
    _loadSettings() {
        const savedSettings = localStorage.getItem('cubewell_settings');
        
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            
            if (this.elements.musicVolumeSlider) {
                this.elements.musicVolumeSlider.value = settings.musicVolume || 50;
            }
            
            if (this.elements.sfxVolumeSlider) {
                this.elements.sfxVolumeSlider.value = settings.sfxVolume || 70;
            }
            
            if (this.elements.difficultySelect) {
                this.elements.difficultySelect.value = settings.difficulty || 'medium';
            }
            
            // Apply the settings to the AudioManager if it's initialized
            if (AudioManager.initialized) {
                AudioManager.setMusicVolume((settings.musicVolume || 50) / 100);
                AudioManager.setSfxVolume((settings.sfxVolume || 70) / 100);
            }
        }
    },
    
    // Save a high score
    _saveHighScore(score) {
        let highScores = JSON.parse(localStorage.getItem('cubewell_highscores') || '[]');
        
        // Add the new score
        highScores.push({
            score: score,
            date: new Date().toISOString().split('T')[0]
        });
        
        // Sort by score (descending)
        highScores.sort((a, b) => b.score - a.score);
        
        // Keep only top 10
        highScores = highScores.slice(0, 10);
        
        // Save back to localStorage
        localStorage.setItem('cubewell_highscores', JSON.stringify(highScores));
        
        // Update high score display
        this._updateHighScoreDisplay();
    },
    
    // Load high scores from localStorage
    _loadHighScores() {
        const highScores = JSON.parse(localStorage.getItem('cubewell_highscores') || '[]');
        
        // Update high score display
        if (highScores.length > 0 && this.elements.highScoreDisplay) {
            this.elements.highScoreDisplay.textContent = highScores[0].score;
        }
    },
    
    // Update the high score display
    _updateHighScoreDisplay() {
        const highScores = JSON.parse(localStorage.getItem('cubewell_highscores') || '[]');
        
        if (highScores.length > 0 && this.elements.highScoreDisplay) {
            this.elements.highScoreDisplay.textContent = highScores[0].score;
        }
    },
    
    // Public methods for external use
    
    // Start game
    startGame() {
        this._startGame();
    },
    
    // Restart game
    restartGame() {
        // If the game is over, restart it
        if (!this.game.state.isRunning) {
            this.game.reset();
            this._startGame();
        } else {
            // If the game is running, ask for confirmation before restarting
            if (confirm('Are you sure you want to restart the game?')) {
                this.game.reset();
                this._startGame();
            }
        }
    },
    
    // Toggle music
    toggleMusic() {
        if (AudioManager.initialized) {
            const isMusicOn = AudioManager.toggleMusic();
            console.log(`Music is now ${isMusicOn ? 'on' : 'off'}`);
        } else {
            console.log("Audio system not initialized yet");
        }
    },
    
    // Set difficulty
    setDifficulty(level) {
        if (this.elements.difficultySelect) {
            this.elements.difficultySelect.value = level;
        }
        this._applyDifficulty();
    },
    
    // Update score (callback method for game)
    updateScore(score) {
        this._updateScore(score);
    },
    
    // Update level (callback method for game)
    updateLevel(level) {
        this._updateLevel(level);
    },
    
    // Show game over (callback method for game)
    showGameOver(score) {
        this._showGameOver(score);
    },
    
    // Load high scores
    loadHighScores() {
        this._loadHighScores();
    },
    
    // Add high score
    addHighScore(score) {
        this._saveHighScore(score);
        this._updateHighScoreDisplay();
    },
    
    // Update high score display
    updateHighScoreDisplay() {
        this._updateHighScoreDisplay();
    }
};

export default UI; 